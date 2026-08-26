import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import hero from '../../assets/hero.webp';
import heroSmall from '../../assets/hero-small.webp';
import { Reveal } from '../../shared/ui/reveal.tsx';

interface HeroProps {
  total: number | undefined;
  found: number | undefined;
  lost: number | undefined;
  adoption: number | undefined;
}

// dt then dd in the source, because a dl may only hold those two, and
// column-reverse to put the number above its label. axe caught the first
// version, which was a div of two paragraphs.
const Stat = ({ value, label }: { value: number | undefined; label: string }) => (
  <div className="flex flex-col-reverse">
    <dt className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
    <dd className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">
      {/* an em dash while the count loads, not a zero: zero is a fact and this
          is the absence of one */}
      {value === undefined ? '—' : value}
    </dd>
  </div>
);

export const Hero = ({ total, found, lost, adoption }: HeroProps) => {
  const { t } = useTranslation();

  return (
    <header className="border-t border-rule/15 pt-5 sm:pt-7">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-[3.5rem_1fr] sm:gap-y-8">
        <p className="section-index text-xs font-medium text-muted sm:pt-1">01</p>

        <div className="min-w-0">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.18em] text-brand">{t('hero.eyebrow')}</p>
          </Reveal>

          {/* one Reveal per line, staggered: the headline arrives as three
              beats rather than one block sliding in */}
          <h1 className="mt-3 font-display text-display font-semibold text-balance sm:mt-4">
            {[t('hero.lineOne'), t('hero.lineTwo'), t('hero.lineThree')].map((line, index) => (
              <Reveal key={line} delay={index * 90}>
                <span className="block">{line}</span>
              </Reveal>
            ))}
          </h1>

          <div className="mt-7 grid gap-7 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end lg:gap-8">
            <Reveal delay={140} className="max-w-prose">
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

            <Reveal delay={220}>
              <figure className="group relative overflow-hidden rounded-sm">
                <img
                  src={hero}
                  srcSet={`${heroSmall} 900w, ${hero} 1800w`}
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  alt=""
                  width={1800}
                  height={1000}
                  /* the only image above the fold, so it is the one worth
                     fetching eagerly and decoding off the main thread */
                  decoding="async"
                  fetchPriority="high"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]"
                />
                <figcaption className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  {t('hero.photoCredit')}
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </div>
    </header>
  );
};
