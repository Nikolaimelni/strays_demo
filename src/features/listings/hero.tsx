import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import hero from '../../assets/hero.webp';
import heroSmall from '../../assets/hero-small.webp';
import { Reveal } from '../../shared/ui/reveal.tsx';
import { Band } from '../../shared/ui/section.tsx';

interface HeroProps {
  total: number | undefined;
  found: number | undefined;
  lost: number | undefined;
  adoption: number | undefined;
}

const Stat = ({ value, label }: { value: number | undefined; label: string }) => (
  <div className="flex flex-col-reverse">
    <dt className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
    <dd className="font-display text-3xl font-semibold sm:text-4xl">
      {value === undefined ? (
        <span className="text-muted">—</span>
      ) : (
        <>
          <span aria-hidden className="tally" style={{ '--to': value } as CSSProperties} />
          <span className="sr-only">{value}</span>
        </>
      )}
    </dd>
  </div>
);

export const Hero = ({ total, found, lost, adoption }: HeroProps) => {
  const { t } = useTranslation();
  const lines = [t('hero.lineOne'), t('hero.lineTwo'), t('hero.lineThree')];

  return (
    <header className="border-t border-rule/15 pt-5 sm:pt-7">
      <Band index="01">
        <Reveal immediate>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-brand">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-brand" />
            {t('hero.eyebrow')}
          </p>
        </Reveal>

        <h1 className="mt-3 font-display text-display font-semibold text-balance sm:mt-4">
          {lines.map((line, index) => (
            <span key={line} className="line-mask">
              <span style={{ animationDelay: `${index * 110}ms` }}>{line}</span>
            </span>
          ))}
        </h1>

        <div className="mt-7 grid gap-7 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end lg:gap-8">
          <Reveal immediate delay={140} className="max-w-prose">
            <p className="text-lead text-muted">{t('hero.lead')}</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a
                href="#map"
                className="group inline-flex items-center gap-2 border-b-2 border-ink pb-1 font-medium"
              >
                {t('hero.browse')}
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </a>
              <Link to="/new" className="link-underline text-muted hover:text-ink">
                {t('hero.post')}
              </Link>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-5 border-t border-rule/15 pt-6 sm:gap-x-10">
              <Stat value={total} label={t('hero.statListings')} />
              <Stat value={found} label={t('hero.statFound')} />
              <Stat value={lost} label={t('hero.statLost')} />
              <Stat value={adoption} label={t('hero.statAdoption')} />
            </dl>
          </Reveal>

          <Reveal immediate delay={220}>
            <figure>
              <div className="overflow-hidden rounded-sm">
                <img
                  src={hero}
                  srcSet={`${heroSmall} 900w, ${hero} 1800w`}
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  alt=""
                  width={1800}
                  height={1000}
                  decoding="async"
                  fetchPriority="high"
                  className="drift aspect-[16/10] w-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                {t('hero.photoCredit')}
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Band>
    </header>
  );
};
