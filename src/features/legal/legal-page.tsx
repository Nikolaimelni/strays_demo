import { useTranslation } from 'react-i18next';
import { env, isDemo } from '../../env.ts';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Band } from '../../shared/ui/section.tsx';

// a policy that names no way to reach a person is not a policy, so this comes from the
// environment and boot fails without it, outside the demo
const CONTACT_EMAIL = env.VITE_CONTACT_EMAIL;

interface Section {
  title: string;
  body: string;
}

interface LegalPageProps {
  title: string;
  intro: string;
  sections: readonly Section[];
}

// the bodies carry their own paragraph breaks so a section stays one
// translation key. thirty keys is already more than anybody wants to keep in
// step across two languages.
export const LegalPage = ({ title, intro, sections }: LegalPageProps) => {
  const { t } = useTranslation();

  return (
    <div className="border-t border-rule/15 pt-5 sm:pt-7">
      <PageMeta title={title} description={intro} />
      <Band index="01">
        <div className="max-w-prose">
          <h1 className="font-display text-title font-semibold text-balance">{title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
            {t('legal.updated')}
          </p>
          {isDemo ? (
            <p className="mt-7 border-l-2 border-brand/40 pl-4 text-sm text-muted">
              {t('demo.legal')}
            </p>
          ) : null}

          <p className="mt-7 text-lead text-muted">{intro}</p>

          <div className="mt-12 space-y-9">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-lg font-semibold">{section.title}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* always rendered: the policy sends people to "the address at the bottom of
              this page", so the bottom of the page has to answer even without one */}
          <p className="mt-12 border-t border-rule/15 pt-5 text-sm text-muted">
            {CONTACT_EMAIL ? (
              <>
                {t('legal.contact')}{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline text-brand">
                  {CONTACT_EMAIL}
                </a>
              </>
            ) : (
              t('demo.contact')
            )}
          </p>
        </div>
      </Band>
    </div>
  );
};
