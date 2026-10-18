import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import { saveFile } from '../../shared/save-file.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button, buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { PasswordPrompt } from './password-prompt.tsx';

// Articles 15 and 17. Both are one request; the work is in saying plainly what the second
// one takes with it, before somebody presses it.
export const AccountData = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const download = useMutation({
    mutationFn: async () => {
      const { data, error: failed } = await api.GET('/users/me/export');
      if (failed) throw failed;
      saveFile(
        `strays-export-${data.exportedAt.slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
        'application/json',
      );
    },
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  const remove = useMutation({
    mutationFn: async (password: string) => {
      const { error: failed } = await api.DELETE('/users/me', { body: { password } });
      if (failed) throw failed;
    },
    onSuccess: async () => {
      queryClient.clear();
      await navigate('/', { replace: true });
    },
  });

  return (
    <Card className="space-y-4 pt-5">
      <CardTitle>{t('profile.dataTitle')}</CardTitle>

      <div className="space-y-2">
        <p className="text-sm text-muted">{t('profile.exportNote')}</p>
        <button
          type="button"
          className={buttonClass('secondary')}
          disabled={download.isPending}
          onClick={() => {
            setError(null);
            download.mutate();
          }}
        >
          {t('profile.export')}
        </button>
      </div>

      <div className="space-y-2 border-t border-rule/15 pt-4">
        <p className="text-sm text-muted">{t('profile.deleteNote')}</p>
        {deleting ? (
          <PasswordPrompt
            danger
            submitLabel={t('common.confirm')}
            onSubmit={({ password }) => remove.mutateAsync(password)}
            onCancel={() => setDeleting(false)}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setDeleting(true)}>
            {t('profile.delete')}
          </Button>
        )}
      </div>

      {error ? <Alert>{error}</Alert> : null}
    </Card>
  );
};
