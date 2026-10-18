import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { PasswordPrompt } from './password-prompt.tsx';

export const sessionsKey = ['sessions'] as const;

// `others` ends everything but this browser, an id ends that one session
type Ending = { kind: 'others' } | { kind: 'one'; id: string } | null;

export const Sessions = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [ending, setEnding] = useState<Ending>(null);

  const sessions = useQuery({
    queryKey: sessionsKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/users/me/sessions');
      if (error) throw error;
      return data.items;
    },
  });

  const end = useMutation({
    mutationFn: async (password: string) => {
      const target = ending?.kind === 'one' ? { sessionId: ending.id } : {};
      const { error } = await api.POST('/users/me/sessions/end', {
        body: { password, ...target },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setEnding(null);
      await queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
  });

  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );

  const prompt = (
    <PasswordPrompt
      submitLabel={
        ending?.kind === 'one' ? t('profile.sessionEnd') : t('profile.sessionsEndOthers')
      }
      onSubmit={({ password }) => end.mutateAsync(password)}
      onCancel={() => setEnding(null)}
    />
  );

  const others = sessions.data?.filter((session) => !session.current) ?? [];

  return (
    <Card className="space-y-4 pt-5">
      <CardTitle>{t('profile.sessionsTitle')}</CardTitle>
      <p className="text-sm text-muted">{t('profile.sessionsNote')}</p>

      {sessions.isPending ? <Skeleton className="h-16 w-full" /> : null}
      {sessions.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}

      <ul className="divide-y divide-rule/10">
        {sessions.data?.map((session) => {
          return (
            <li key={session.id} className="space-y-2 py-3 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <span>
                  {t('profile.sessionTimes', {
                    started: when(session.createdAt),
                    seen: when(session.lastSeenAt),
                  })}
                </span>
                {session.current ? (
                  <span className="rounded-full bg-found-soft px-2 py-0.5 text-xs text-found">
                    {t('profile.sessionThis')}
                  </span>
                ) : null}
              </p>

              {session.current ? null : ending?.kind === 'one' && ending.id === session.id ? (
                prompt
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnding({ kind: 'one', id: session.id })}
                >
                  {t('profile.sessionEnd')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {others.length > 1 ? (
        ending?.kind === 'others' ? (
          prompt
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setEnding({ kind: 'others' })}>
            {t('profile.sessionsEndOthers')}
          </Button>
        )
      ) : null}
    </Card>
  );
};
