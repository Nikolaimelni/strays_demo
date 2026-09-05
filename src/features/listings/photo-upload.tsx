import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { resizeImage } from './resize-image.ts';

interface PhotoUploadProps {
  photoKeys: string[];
  onChange: (keys: string[]) => void;
  existingUrls?: Record<string, string>;
  max?: number;
}

export const PhotoUpload = ({
  photoKeys,
  onChange,
  existingUrls = {},
  max = 6,
}: PhotoUploadProps) => {
  const { t } = useTranslation();
  const inputId = useId();

  const [previews, setPreviews] = useState<Record<string, string>>({});

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
      const { data, error } = await api.POST('/listings/photos', {
        body: { file: file as unknown as string },
        // openapi-fetch JSON-encodes the body by default, which strips the
        // file. handing back FormData lets fetch set the boundary itself.
        bodySerializer: (body) => {
          const form = new FormData();
          form.append('file', body?.file as unknown as Blob);
          return form;
        },
      });
      if (error) throw error;
      return { key: data.key, preview: URL.createObjectURL(file) };
    },
    onSuccess: ({ key, preview }) => {
      setPreviews((current) => ({ ...current, [key]: preview }));
      onChange([...photoKeys, key]);
    },
  });

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

  // TODO: send them together. one request per file is fine for two photos and
  // obviously not fine for six over a phone connection.

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {t('listing.photos')}
      </label>

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
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={remaining <= 0 || upload.isPending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = '';
        }}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-sm file:text-ink"
      />

      {upload.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
    </div>
  );
};
