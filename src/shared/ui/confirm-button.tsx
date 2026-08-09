import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button.tsx';

interface ConfirmButtonProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export const ConfirmButton = ({ label, onConfirm, disabled }: ConfirmButtonProps) => {
  const { t } = useTranslation();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  if (!armed) {
    return (
      <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setArmed(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Button
        variant="danger"
        size="sm"
        disabled={disabled}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {t('common.confirm')}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setArmed(false)}>
        {t('common.cancel')}
      </Button>
    </span>
  );
};
