import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button.tsx';

interface PhotoLightboxProps {
  urls: string[];
  startAt?: number;
  onClose: () => void;
}

// showModal() is the whole reason this is a <dialog>: focus trap, inert page,
// escape, and focus put back where it came from, none of it ours. it was a div
// with forty lines of keyboard handling that did the same thing worse.
export const PhotoLightbox = ({ urls, startAt = 0, onClose }: PhotoLightboxProps) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(startAt);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const step = (by: number) => setIndex((current) => (current + by + urls.length) % urls.length);

  const current = urls[index];
  if (!current) return null;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') step(1);
        if (event.key === 'ArrowLeft') step(-1);
      }}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      aria-label={t('admin.viewPhotos')}
      className="m-auto w-full max-w-4xl p-4"
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src={current}
          alt={t('admin.photoOf', { index: index + 1, total: urls.length })}
          className="max-h-[75dvh] w-auto max-w-full rounded-sm object-contain"
        />

        <div className="flex items-center gap-3">
          {urls.length > 1 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => step(-1)}>
                ←
              </Button>
              <span className="text-sm text-page">
                {t('admin.photoOf', { index: index + 1, total: urls.length })}
              </span>
              <Button variant="secondary" size="sm" onClick={() => step(1)}>
                →
              </Button>
            </>
          ) : null}
          <Button size="sm" onClick={() => dialog.current?.close()}>
            {t('admin.closePhotos')}
          </Button>
        </div>
      </div>
    </dialog>
  );
};
