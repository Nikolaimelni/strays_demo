import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import { saveFile } from '../../shared/save-file.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button, buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { PasswordPrompt } from './password-prompt.tsx';
import { sessionKey } from './session.ts';
import { sessionsKey } from './sessions.tsx';

type Step =
  | { kind: 'idle' }
  | { kind: 'setup'; secret: string; uri: string }
  | { kind: 'codes'; codes: string[] }
  | { kind: 'disable' }
  | { kind: 'regenerate' };

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});

interface TwoFactorProps {
  enabled: boolean;
  isAdmin: boolean;
}

export const TwoFactor = ({ enabled, isAdmin }: TwoFactorProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  // turning it on or off ends every other session on the server, and flips mfaEnabled
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: sessionKey }),
      queryClient.invalidateQueries({ queryKey: sessionsKey }),
    ]);

  const setup = useMutation({
    mutationFn: async () => {
      const { data, error: failed } = await api.POST('/auth/mfa/setup');
      if (failed) throw failed;
      return data;
    },
    onSuccess: ({ secret, uri }) => setStep({ kind: 'setup', secret, uri }),
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  const disable = async ({ password, code }: { password: string; code: string }) => {
    const { error: failed } = await api.POST('/auth/mfa/disable', { body: { password, code } });
    if (failed) throw failed;
    setStep({ kind: 'idle' });
    await refresh();
  };

  const regenerate = async ({ password, code }: { password: string; code: string }) => {
    const { data, error: failed } = await api.POST('/auth/mfa/recovery-codes', {
      body: { password, code },
    });
    if (failed) throw failed;
    setStep({ kind: 'codes', codes: data.recoveryCodes });
  };

  return (
    <Card className="space-y-4 pt-5">
      <CardTitle>{t('profile.mfaTitle')}</CardTitle>

      <p
        className={`inline-block rounded-lg px-3 py-2 text-sm ${enabled ? 'bg-found-soft text-found' : 'bg-neutral-soft text-muted'}`}
      >
        {enabled ? t('profile.mfaOn') : t('profile.mfaOff')}
      </p>
      {isAdmin && !enabled ? (
        <p className="text-sm text-muted">{t('profile.mfaAdminNote')}</p>
      ) : null}

      {step.kind === 'setup' ? (
        <Setup
          secret={step.secret}
          uri={step.uri}
          onEnabled={async (codes) => {
            setStep({ kind: 'codes', codes });
            await refresh();
          }}
          onCancel={() => setStep({ kind: 'idle' })}
        />
      ) : null}

      {step.kind === 'codes' ? (
        <RecoveryCodes codes={step.codes} onDone={() => setStep({ kind: 'idle' })} />
      ) : null}

      {step.kind === 'disable' ? (
        <PasswordPrompt
          withCode
          danger
          submitLabel={t('profile.mfaDisable')}
          onSubmit={disable}
          onCancel={() => setStep({ kind: 'idle' })}
        />
      ) : null}

      {step.kind === 'regenerate' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{t('profile.recoveryNewNote')}</p>
          <PasswordPrompt
            withCode
            submitLabel={t('profile.recoveryNew')}
            onSubmit={regenerate}
            onCancel={() => setStep({ kind: 'idle' })}
          />
        </div>
      ) : null}

      {step.kind === 'idle' ? (
        enabled ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setStep({ kind: 'regenerate' })}>
              {t('profile.recoveryNew')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep({ kind: 'disable' })}>
              {t('profile.mfaDisable')}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            disabled={setup.isPending}
            onClick={() => {
              setError(null);
              setup.mutate();
            }}
          >
            {t('profile.mfaStart')}
          </Button>
        )
      ) : null}

      {error ? <Alert>{error}</Alert> : null}
    </Card>
  );
};

interface SetupProps {
  secret: string;
  uri: string;
  onEnabled: (codes: string[]) => Promise<void>;
  onCancel: () => void;
}

const Setup = ({ secret, uri, onEnabled, onCancel }: SetupProps) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof codeSchema>>({ resolver: zodResolver(codeSchema) });

  const enable = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await api.POST('/auth/mfa/enable', { body: { code } });
      if (error) throw error;
      return data.recoveryCodes;
    },
  });

  const submit = handleSubmit(async ({ code }) => {
    setFormError(null);
    try {
      await onEnabled(await enable.mutateAsync(code));
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('profile.mfaScan')}</p>
      {/* dark on white whatever the theme: a phone camera reads a light code on a dark
          page badly, and this one only has to be scanned once */}
      <div className="inline-block rounded-lg bg-white p-3">
        <QRCodeSVG value={uri} size={168} title={t('profile.mfaQr')} fgColor="#14120f" />
      </div>
      <p className="text-sm">
        <span className="text-xs uppercase tracking-[0.12em] text-muted">
          {t('profile.mfaKey')}
        </span>
        <code className="mt-1 block select-all break-all font-mono">
          {secret.match(/.{1,4}/g)?.join(' ')}
        </code>
      </p>

      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label={t('profile.mfaCode')} error={errors.code}>
          {(control) => (
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={inputClass}
              {...control}
              {...register('code')}
            />
          )}
        </Field>
        {formError ? <Alert>{formError}</Alert> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={isSubmitting} className={buttonClass('primary', 'sm')}>
            {t('profile.mfaEnable')}
          </button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

const RecoveryCodes = ({ codes, onDone }: { codes: string[]; onDone: () => void }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const text = `${codes.join('\n')}\n`;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t('profile.recoveryTitle')}</p>
      <p className="text-sm text-muted">{t('profile.recoveryNote')}</p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(() => setCopied(true));
          }}
        >
          {t('profile.recoveryCopy')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => saveFile('strays-recovery-codes.txt', text, 'text/plain')}
        >
          {t('profile.recoveryDownload')}
        </Button>
        <Button size="sm" onClick={onDone}>
          {t('profile.recoveryDone')}
        </Button>
        <span aria-live="polite" className="text-xs text-found">
          {copied ? t('profile.recoveryCopied') : ''}
        </span>
      </div>
    </div>
  );
};
