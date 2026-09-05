import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { PageHeading } from '../../shared/ui/page-heading.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { ListingForm, type ListingFormValues } from './listing-form.tsx';

// read from /listings/mine and not /listings/{id}: a pending listing is not
// public, so the public endpoint 404s on exactly the ones needing an edit
const myListingsKey = ['listings', 'mine'] as const;

export const EditListingPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mine = useQuery({
    queryKey: myListingsKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/listings/mine');
      if (error) throw error;
      return data.items;
    },
  });

  const update = useMutation({
    mutationFn: async (body: ListingFormValues) => {
      const { error } = await api.PATCH('/listings/{id}', { params: { path: { id } }, body });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myListingsKey }),
  });

  if (mine.isPending) return <Skeleton className="h-96 w-full" />;
  if (mine.isError) return <Alert>{t('errors.UNKNOWN')}</Alert>;

  const listing = mine.data.find((candidate) => candidate.id === id);
  if (!listing) return <Alert>{t('errors.LISTING_NOT_FOUND')}</Alert>;

  const photoUrlByKey: Record<string, string> = {};
  listing.photoKeys.forEach((key, index) => {
    const url = listing.photoUrls[index];
    if (url) photoUrlByKey[key] = url;
  });

  return (
    <div className="space-y-8">
      <PageMeta title={t('listing.edit')} />
      <PageHeading index="01" title={t('listing.edit')} />

      <div className="max-w-xl space-y-5 sm:pl-[4.625rem]">
        {listing.status === 'APPROVED' ? (
          <p className="border-l-2 border-lost py-1 pl-3 text-sm text-lost">
            {t('listing.editResetsReview')}
          </p>
        ) : null}

        <ListingForm
          submitLabel={t('listing.save')}
          existingPhotoUrls={photoUrlByKey}
          defaultValues={{
            photoKeys: listing.photoKeys,
            type: listing.type,
            species: listing.species,
            description: listing.description,
            city: listing.city,
            lat: listing.lat,
            lng: listing.lng,
          }}
          onSubmit={async (values) => {
            await update.mutateAsync(values);
            await navigate('/mine', { replace: true });
          }}
        />
      </div>
    </div>
  );
};
