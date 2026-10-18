import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import type { components } from '../../shared/api/schema';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button, buttonClass } from '../../shared/ui/button.tsx';
import { ChoiceGroup } from '../../shared/ui/choice-group.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { inputClass } from '../../shared/ui/field.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { useSession } from '../auth/session.ts';
import { Pagination } from '../listings/pagination.tsx';
import { AdminNav } from './admin-nav.tsx';
import { ReasonForm } from './reason-form.tsx';

type Account = components['schemas']['AdminUserListResponseDto']['items'][number];

const LIMIT = 20;

const searchSchema = z.object({ email: z.string().trim().max(254) });

export const UsersPage = () => {
  const { t } = useTranslation();
  const { data: me } = useSession();
  const [email, setEmail] = useState('');
  const [which, setWhich] = useState<'all' | 'blocked'>('all');
  const [page, setPage] = useState(1);

  const users = useQuery({
    queryKey: ['admin', 'users', email, which, page],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/users', {
        params: {
          query: {
            page,
            limit: LIMIT,
            ...(email ? { email } : {}),
            ...(which === 'blocked' ? { blocked: 'true' as const } : {}),
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const { register, handleSubmit } = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { email: '' },
  });

  const search = handleSubmit((values) => {
    setEmail(values.email);
    setPage(1);
  });

  return (
    <div className="space-y-8">
      <PageMeta title={t('admin.users')} />
      <PageHeading index="01" title={t('admin.users')} aside={<AdminNav />} />

      <div className="space-y-5 sm:pl-[4.625rem]">
        <form onSubmit={search} className="flex max-w-md items-end gap-3">
          <label className="min-w-0 flex-1 space-y-1.5">
            <span className="block text-xs uppercase tracking-[0.12em] text-muted">
              {t('admin.usersSearch')}
            </span>
            <input type="search" className={inputClass} {...register('email')} />
          </label>
          <button type="submit" className={buttonClass('secondary', 'sm')}>
            {t('admin.usersSearchSubmit')}
          </button>
        </form>

        <ChoiceGroup
          legend={t('admin.usersFilter')}
          name="which-users"
          size="sm"
          value={which}
          onChange={(next) => {
            setWhich(next);
            setPage(1);
          }}
          choices={[
            { value: 'all', label: t('admin.usersAll') },
            { value: 'blocked', label: t('admin.usersBlocked') },
          ]}
        />

        {users.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
        {users.isPending ? <ListingCardSkeleton /> : null}

        <ul className="divide-y divide-rule/10 border-t border-rule/15">
          {users.data?.items.map((account) => (
            <AccountRow key={account.id} account={account} isSelf={account.id === me?.id} />
          ))}
        </ul>

        {users.data ? (
          <Pagination
            page={users.data.page}
            limit={users.data.limit}
            total={users.data.total}
            onChange={setPage}
          />
        ) : null}

        {users.isSuccess && users.data.items.length === 0 ? (
          <EmptyState title={t('admin.usersEmpty')} />
        ) : null}
      </div>
    </div>
  );
};

type Asking = 'block' | 'mfa' | null;

const AccountRow = ({ account, isSelf }: { account: Account; isSelf: boolean }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState<Asking>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const path = { params: { path: { id: account.id } } };

  const settle = async () => {
    setAsking(null);
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  const act = useMutation({
    mutationFn: async (action: 'promote' | 'demote' | 'unblock' | 'sessions') => {
      const { error: failed } =
        action === 'unblock'
          ? await api.POST('/admin/users/{id}/unblock', path)
          : action === 'sessions'
            ? await api.DELETE('/admin/users/{id}/sessions', path)
            : await api.POST('/admin/users/{id}/role', {
                ...path,
                body: { role: action === 'promote' ? 'ADMIN' : 'USER' },
              });
      if (failed) throw failed;
      return action;
    },
    onMutate: () => {
      setError(null);
      setNotice(null);
    },
    onSuccess: async (action) => {
      if (action === 'sessions') setNotice(t('admin.userSessionsEnded'));
      await settle();
    },
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  const block = async (reason: string) => {
    const { error: failed } = await api.POST('/admin/users/{id}/block', {
      ...path,
      body: { reason },
    });
    if (failed) throw failed;
    await settle();
  };

  const resetMfa = async (reason: string) => {
    const { error: failed } = await api.POST('/admin/users/{id}/mfa/reset', {
      ...path,
      body: { reason },
    });
    if (failed) throw failed;
    await settle();
  };

  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(iso));

  return (
    <li className="space-y-3 py-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium break-all">{account.email}</span>
        {isSelf ? <span className="text-xs text-muted">({t('admin.userYou')})</span> : null}
        <span className="rounded-full bg-neutral-soft px-2 py-0.5 text-xs text-muted">
          {t(`admin.role${account.role}`)}
        </span>
        {account.mfaEnabled ? (
          <span className="rounded-full bg-found-soft px-2 py-0.5 text-xs text-found">
            {t('admin.userMfaOn')}
          </span>
        ) : null}
        {account.blockedAt ? (
          <span className="rounded-full bg-lost-soft px-2 py-0.5 text-xs text-lost">
            {t('admin.userBlockedOn', { date: when(account.blockedAt) })}
          </span>
        ) : null}
      </div>

      <p className="flex flex-wrap gap-x-4 text-xs text-muted">
        <span>{t('admin.userListings', { count: account.listings })}</span>
        <Link to={`/admin/audit?userId=${account.id}`} className="link-underline hover:text-ink">
          {t('admin.userHistory')}
        </Link>
      </p>

      {account.blockReason ? (
        <p className="border-l-2 border-rule/25 py-0.5 pl-3 text-muted">{account.blockReason}</p>
      ) : null}

      {/* the server refuses most of these on your own account anyway; not offering them
          saves a moderator from locking themselves out by misclicking their own row */}
      {isSelf ? null : asking === 'block' ? (
        <ReasonForm
          label={t('admin.userBlockReason')}
          submitLabel={t('admin.userBlock')}
          onSubmit={block}
          onCancel={() => setAsking(null)}
        />
      ) : asking === 'mfa' ? (
        <ReasonForm
          label={t('admin.userMfaResetReason')}
          submitLabel={t('admin.userMfaReset')}
          onSubmit={resetMfa}
          onCancel={() => setAsking(null)}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={act.isPending}
            onClick={() => act.mutate(account.role === 'ADMIN' ? 'demote' : 'promote')}
          >
            {account.role === 'ADMIN' ? t('admin.userDemote') : t('admin.userPromote')}
          </Button>
          {account.blockedAt ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={act.isPending}
              onClick={() => act.mutate('unblock')}
            >
              {t('admin.userUnblock')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setAsking('block')}>
              {t('admin.userBlock')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={act.isPending}
            onClick={() => act.mutate('sessions')}
          >
            {t('admin.userEndSessions')}
          </Button>
          {account.mfaEnabled ? (
            <Button variant="ghost" size="sm" onClick={() => setAsking('mfa')}>
              {t('admin.userMfaReset')}
            </Button>
          ) : null}
        </div>
      )}

      {error ? <Alert>{error}</Alert> : null}
      <p aria-live="polite" className="text-xs text-found empty:hidden">
        {notice ?? ''}
      </p>
    </li>
  );
};
