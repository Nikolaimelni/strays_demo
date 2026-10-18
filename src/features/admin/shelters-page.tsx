import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import { errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import type { components } from '../../shared/api/schema';
import { safeHttpUrl } from '../../shared/safe-http-url.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button } from '../../shared/ui/button.tsx';
import { ConfirmButton } from '../../shared/ui/confirm-button.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { AdminNav } from './admin-nav.tsx';
import { ReasonForm } from './reason-form.tsx';
import { ShelterForm, type ShelterValues } from './shelter-form.tsx';

type Shelter = components['schemas']['AdminShelterListResponseDto']['items'][number];

const sheltersKey = ['admin', 'shelters'] as const;

// an import answers 202 and carries on in the background. while any of them is running
// the list is read again every two seconds, which is the only way to see it finish
const POLL_MS = 2000;

export const SheltersPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shelters = useQuery({
    queryKey: sheltersKey,
    queryFn: async () => {
      const { data, error: failed } = await api.GET('/admin/shelters');
      if (failed) throw failed;
      return data.items;
    },
    refetchInterval: (query) =>
      query.state.data?.some((shelter) => shelter.importRunning) ? POLL_MS : false,
  });

  const importAll = useMutation({
    mutationFn: async () => {
      const { data, error: failed } = await api.POST('/admin/shelters/import');
      if (failed) throw failed;
      return data.shelters;
    },
    onMutate: () => {
      setError(null);
      setNotice(null);
    },
    onSuccess: async (count) => {
      setNotice(t('admin.importAllStarted', { count }));
      await queryClient.invalidateQueries({ queryKey: sheltersKey });
    },
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  const create = async (values: ShelterValues) => {
    const { error: failed } = await api.POST('/admin/shelters', {
      body: {
        name: values.name,
        city: values.city,
        ...(values.sourceUrl ? { sourceUrl: values.sourceUrl } : {}),
        ...(values.feedUrl ? { feedUrl: values.feedUrl } : {}),
      },
    });
    if (failed) throw failed;
    setAdding(false);
    await queryClient.invalidateQueries({ queryKey: sheltersKey });
  };

  const importable = shelters.data?.some((shelter) => shelter.feedUrl && shelter.feedConsentAt);

  return (
    <div className="space-y-8">
      <PageMeta title={t('admin.shelters')} />
      <PageHeading index="01" title={t('admin.shelters')} aside={<AdminNav />} />

      <div className="space-y-5 sm:pl-[4.625rem]">
        <p className="max-w-prose text-sm text-muted">{t('admin.importAuto')}</p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!importable || importAll.isPending}
            onClick={() => importAll.mutate()}
          >
            {t('admin.importAll')}
          </Button>
          {adding ? null : (
            <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
              {t('admin.sheltersAdd')}
            </Button>
          )}
        </div>

        {adding ? <ShelterForm onSubmit={create} onCancel={() => setAdding(false)} /> : null}

        {error ? <Alert>{error}</Alert> : null}
        <p aria-live="polite" className="text-sm text-found empty:hidden">
          {notice ?? ''}
        </p>

        {shelters.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
        {shelters.isPending ? <ListingCardSkeleton /> : null}

        <ul className="divide-y divide-rule/10 border-t border-rule/15">
          {shelters.data?.map((shelter) => (
            <ShelterRow key={shelter.id} shelter={shelter} />
          ))}
        </ul>

        {shelters.isSuccess && shelters.data.length === 0 ? (
          <EmptyState title={t('admin.sheltersEmpty')} />
        ) : null}
      </div>
    </div>
  );
};

type Mode = 'view' | 'edit' | 'consent';

const ShelterRow = ({ shelter }: { shelter: Shelter }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('view');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const path = { params: { path: { id: shelter.id } } };
  const site = safeHttpUrl(shelter.sourceUrl);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

  const start = useMutation({
    mutationFn: async () => {
      const { error: failed } = await api.POST('/admin/shelters/{id}/import', path);
      if (failed) throw failed;
    },
    onMutate: () => setError(null),
    onSuccess: refresh,
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const { data, error: failed } = await api.DELETE('/admin/shelters/{id}/consent', path);
      if (failed) throw failed;
      return data.removed;
    },
    onMutate: () => setError(null),
    onSuccess: async (removed) => {
      setNotice(t('admin.consentWithdrawn', { count: removed }));
      await refresh();
    },
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  const save = async (values: ShelterValues) => {
    const { error: failed } = await api.PATCH('/admin/shelters/{id}', {
      ...path,
      body: {
        name: values.name,
        city: values.city,
        sourceUrl: values.sourceUrl || null,
        feedUrl: values.feedUrl || null,
      },
    });
    if (failed) throw failed;
    setMode('view');
    await refresh();
  };

  const recordConsent = async (note: string) => {
    const { error: failed } = await api.POST('/admin/shelters/{id}/consent', {
      ...path,
      body: { note },
    });
    if (failed) throw failed;
    setNotice(null);
    setMode('view');
    await refresh();
  };

  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );

  const last = shelter.lastImport;

  return (
    <li className="space-y-3 py-5 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-medium">{shelter.name}</span>
        <span className="text-muted">{shelter.city}</span>
        {site ? (
          <a
            href={site}
            target="_blank"
            rel="noreferrer"
            className="link-underline text-muted hover:text-ink"
          >
            {new URL(site).host}
          </a>
        ) : null}
      </div>

      {mode === 'edit' ? (
        <ShelterForm
          defaultValues={{
            name: shelter.name,
            city: shelter.city,
            sourceUrl: shelter.sourceUrl ?? '',
            feedUrl: shelter.feedUrl ?? '',
          }}
          onSubmit={save}
          onCancel={() => setMode('view')}
        />
      ) : (
        <>
          <p className="break-all font-mono text-xs text-muted">
            {shelter.feedUrl ?? t('admin.feedNone')}
          </p>

          {shelter.feedConsentAt ? (
            <p className="border-l-2 border-found/40 py-0.5 pl-3 text-muted">
              {t('admin.consentRecorded', {
                date: when(shelter.feedConsentAt),
                note: shelter.feedConsentNote ?? '',
              })}
            </p>
          ) : (
            <p className="border-l-2 border-rule/25 py-0.5 pl-3 text-muted">
              {t('admin.consentNone')}
            </p>
          )}

          <p aria-live="polite" className="text-xs text-muted">
            {shelter.importRunning
              ? t('admin.importRunning')
              : last
                ? t('admin.importLast', { ...last, date: when(last.finishedAt) })
                : t('admin.importNever')}
          </p>
          {last?.message && !shelter.importRunning ? (
            <p className="text-xs text-lost">{last.message}</p>
          ) : null}

          {mode === 'consent' ? (
            <ReasonForm
              label={t('admin.consentNote')}
              submitLabel={t('admin.consentRecord')}
              onSubmit={recordConsent}
              onCancel={() => setMode('view')}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={
                  !shelter.feedUrl ||
                  !shelter.feedConsentAt ||
                  shelter.importRunning ||
                  start.isPending
                }
                onClick={() => start.mutate()}
              >
                {t('admin.importNow')}
              </Button>
              {shelter.feedConsentAt ? (
                <ConfirmButton
                  label={t('admin.consentWithdraw')}
                  disabled={withdraw.isPending}
                  onConfirm={() => withdraw.mutate()}
                />
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setMode('consent')}>
                  {t('admin.consentRecord')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setMode('edit')}>
                {t('admin.shelterEdit')}
              </Button>
            </div>
          )}
        </>
      )}

      {error ? <Alert>{error}</Alert> : null}
      <p aria-live="polite" className="text-xs text-found empty:hidden">
        {notice ?? ''}
      </p>
    </li>
  );
};
