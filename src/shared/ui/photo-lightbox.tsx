import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button.tsx';

interface PhotoLightboxProps {
  urls: string[];
  startAt?: number;
  onClose: () => void;
}

// shared, not admin-only: a visitor deciding whether this is their cat needs to
// see the photo full size just as much as the moderator deciding whether it is
// allowed at all.
export const PhotoLightbox = ({ urls, startAt = 0, onClose }: PhotoLightboxProps) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(startAt);
  const dialog = useRef<HTMLDivElement>(null);

  // the document's focus is the external thing this syncs with. claiming
  // aria-modal while focus is still on the thumbnail behind it leaves a
  // keyboard user tabbing through a page they cannot see, and dropping focus
  // back where it came from is the other half of the same promise.
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % urls.length);
      if (event.key === 'ArrowLeft')
        setIndex((current) => (current - 1 + urls.length) % urls.length);
      if (event.key !== 'Tab') return;

      // everything focusable in here is a button, so the trap is a list and two
      // edges rather than a general-purpose solution
      const buttons = [...(dialog.current?.querySelectorAll('button') ?? [])];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;

      const edge = event.shiftKey ? first : last;
      if (document.activeElement === edge || document.activeElement === dialog.current) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, urls.length]);

  const current = urls[index];
  if (!current) return null;

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.viewPhotos')}
      // -1 so the dialog itself can hold focus on open: there is nothing above
      // the buttons to land on, and focus has to leave the page behind it
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/80 p-4"
    >
      <img
        src={current}
        alt={t('admin.photoOf', { index: index + 1, total: urls.length })}
        className="max-h-[75vh] max-w-full rounded-lg object-contain"
      />

      <div className="flex items-center gap-3">
        {urls.length > 1 ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex((current_) => (current_ - 1 + urls.length) % urls.length)}
            >
              ←
            </Button>
            <span className="text-sm text-page">
              {t('admin.photoOf', { index: index + 1, total: urls.length })}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex((current_) => (current_ + 1) % urls.length)}
            >
              →
            </Button>
          </>
        ) : null}
        <Button size="sm" onClick={onClose}>
          {t('admin.closePhotos')}
        </Button>
      </div>
    </div>
  );
};
