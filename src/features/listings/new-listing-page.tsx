import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { PageHeading } from '../../shared/ui/page-heading.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { ListingForm, type ListingFormValues } from './listing-form.tsx';

export const NewListingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const create = useMutation({
    mutationFn: async (body: ListingFormValues) => {
      const { data, error } = await api.POST('/listings', { body });
      if (error) throw error;
      return data.item;
    },
  });

  return (
    <div className="space-y-8">
      <PageMeta title={t('nav.post')} description={t('listing.moderationNote')} />
      <PageHeading index="01" title={t('nav.post')} lead={t('listing.moderationNote')} />

      <div className="max-w-xl sm:pl-[4.625rem]">
        <ListingForm
          submitLabel={t('listing.submit')}
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            await navigate('/mine', { replace: true });
          }}
        />
      </div>
    </div>
  );
};
