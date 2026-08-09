export const PageMeta = ({ title, description }: { title: string; description?: string }) => (
  <>
    <title>{`${title} · strays`}</title>
    {description ? <meta name="description" content={description} /> : null}
  </>
);
