import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { ImageUnreadableError, PhotoTooLargeError, resizeImage } from './resize-image.ts';

interface PhotoUploadProps {
  photoKeys: string[];
  onChange: (keys: string[]) => void;
  existingUrls?: Record<string, string>;
  max?: number;
}

const MAX_MB = 10;

export const PhotoUpload = ({
  photoKeys,
  onChange,
  existingUrls = {},
  max = 6,
}: PhotoUploadProps) => {
  const { t } = useTranslation();
  const inputId = useId();

  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // an object url is a browser resource, not react state: it holds the file
  // alive until it is handed back. the ref mirrors the map so the unmount
  // cleanup sees the latest without re-running.
  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(
    () => () => {
      for (const url of Object.values(previewsRef.current)) URL.revokeObjectURL(url);
    },
    [],
  );

  const upload = useMutation({
    mutationFn: async (original: File) => {
      const file = await resizeImage(original);
      const { data, error: failed } = await api.POST('/listings/photos', {
        body: { file: file as unknown as string },
        // openapi-fetch JSON-encodes the body by default, which strips the
        // file. handing back FormData lets fetch set the boundary itself.
        bodySerializer: (body) => {
          const form = new FormData();
          form.append('file', body?.file as unknown as Blob);
          return form;
        },
      });
      if (failed) throw failed;
      return { key: data.key, preview: URL.createObjectURL(file) };
    },
  });

  // TODO: send them together. one request per file is fine for two photos and
  // obviously not fine for six over a phone connection.
  //
  // the keys accumulate in a local, not through photoKeys: that prop is the
  // value from this render and the loop outruns it.
  const add = async (chosen: File[]) => {
    let keys = photoKeys;
    const room = max - keys.length;

    // said first, so a later per-file problem is the message left on screen
    setError(chosen.length > room ? t('listing.photoTooMany', { max }) : null);

    for (const file of chosen.slice(0, room)) {
      if (!file.type.startsWith('image/')) {
        setError(t('listing.photoWrongType'));
        continue;
      }
      // accept= is a hint to the file dialog, not a rule, and a phone will
      // happily offer a 40 MB burst frame
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(t('listing.photoTooBig', { mb: MAX_MB }));
        continue;
      }

      try {
        const { key, preview } = await upload.mutateAsync(file);
        keys = [...keys, key];
        setPreviews((current) => ({ ...current, [key]: preview }));
        onChange(keys);
      } catch (failed) {
        // one unreadable file says nothing about the next one. a failed
        // request usually does, so that one stops the batch.
        if (failed instanceof ImageUnreadableError) {
          setError(t('listing.photoUnreadable'));
          continue;
        }
        if (failed instanceof PhotoTooLargeError) {
          setError(t('listing.photoStillTooBig'));
          continue;
        }
        setError(t('listing.photoFailed'));
        break;
      }
    }
  };

  const remove = (key: string) => {
    const preview = previews[key];
    if (preview) URL.revokeObjectURL(preview);
    setPreviews((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    onChange(photoKeys.filter((kept) => kept !== key));
  };

  const remaining = max - photoKeys.length;

  return (
    <div className="space-y-2">
      {/* same shape as Field's label and the map's, so the four labels on this
          form read as one set */}
      <label htmlFor={inputId} className="block text-xs uppercase tracking-[0.12em] text-muted">
        {t('listing.photos')}
      </label>
      <p id={`${inputId}-hint`} className="text-xs text-muted">
        {t('listing.photoHint', { max, mb: MAX_MB })}
      </p>

      {photoKeys.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {photoKeys.map((key) => {
            const src = previews[key] ?? existingUrls[key];
            return (
              <li key={key} className="relative">
                {src ? (
                  <img src={src} alt="" className="size-20 rounded-lg object-cover" />
                ) : (
                  <div className="size-20 rounded-lg bg-sunken" />
                )}
                <button
                  type="button"
                  onClick={() => remove(key)}
                  aria-label={t('listing.removePhoto')}
                  className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-xs text-page"
                >
                  x
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <input
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        aria-describedby={`${inputId}-hint`}
        disabled={remaining <= 0 || upload.isPending}
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (chosen.length > 0) void add(chosen);
        }}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-sm file:text-ink"
      />

      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
};
