import { Link } from '../../app/router';
import { CallCard } from '../../components/CallCard';
import { HubList, type HubItem } from '../../components/HubList';
import { Page } from '../../components/Page';
import { EMERGENCY, HEALTHLINE, MISCARRIAGE_SUPPORT, NEED_TO_TALK, PLUNKETLINE, SANDS } from '../../data/helplines';
import { VISITS } from '../../data/immunisations';
import { useImmunisationsDone } from '../immunisations/ImmunisationsPage';
import { nextVisit } from '../../lib/immunisations';
import { formatBabyAge } from '../../lib/babyAge';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import { formatWeeksDays, gestationalAge } from '../../lib/pregnancy';
import type { PregnancyEnding, PregnancyProfile } from '../../lib/profile';

const footer = (
  <p className="page-footer">
    <a href="./privacy.html" className="text-link">
      Privacy policy
    </a>
  </p>
);

const BABY_TOOLS: readonly HubItem[] = [
  { to: '/baby', title: 'Baby log', description: 'Feeds, nappies and sleep', icon: '🍼' },
];

const KEEPSAKES: readonly HubItem[] = [
  { to: '/tools/photos', title: 'Bump photos', description: 'Your photo timeline and slideshow', icon: '📸' },
  { to: '/journal', title: 'Journal', description: 'Everything you wrote along the way', icon: '📓' },
  { to: '/more/print', title: 'Print summary', description: 'Your dates and logs on one page', icon: '🖨️' },
  { to: '/more/data', title: 'Your data', description: 'Back up, import or delete', icon: '💾' },
];

/** Home once the baby is born: birth details, help lines for new parents, and the pregnancy keepsakes. */
export function BornHome({
  profile,
  ending,
  today,
}: {
  profile: PregnancyProfile;
  ending: Extract<PregnancyEnding, { kind: 'born' }>;
  today: LocalDate;
}) {
  const ga = gestationalAge(profile.dueDate, ending.date);
  const [done] = useImmunisationsDone();
  const nextJab = nextVisit(VISITS, ending.date, done);
  const name = ending.name || profile.nickname;
  return (
    <Page title="Home" hideTitle footer={footer}>
      <section className="card hero" aria-labelledby="born-heading">
        <h2 id="born-heading" className="hero__ga">
          {name ? `Welcome, ${name}` : 'Welcome, little one'} 💛
        </h2>
        <p className="hero__tri">{formatBabyAge(ending.date, today)}</p>
        <dl className="details">
          <dt>Born</dt>
          <dd>{formatDisplayDate(ending.date)}</dd>
          {ga.totalDays >= 0 && (
            <>
              <dt>At</dt>
              <dd>{formatWeeksDays(ga.weeks, ga.days)}</dd>
            </>
          )}
          {ending.weightG && (
            <>
              <dt>Weight</dt>
              <dd>
                {ending.weightG.toLocaleString('en-NZ')} g ({(ending.weightG / 1000).toFixed(2)} kg)
              </dd>
            </>
          )}
        </dl>
        <Link to="/settings" className="text-link">
          Change birth details
        </Link>
      </section>
      <section className="card help-row" aria-labelledby="emergency-heading">
        <h2 id="emergency-heading">In an emergency</h2>
        <div className="button-row">
          <a className="btn btn--danger" href={EMERGENCY.tel}>
            Call 111
          </a>
          <Link to="/help" className="btn btn--ghost">
            Not breathing or choking
          </Link>
        </div>
      </section>
      {nextJab && (
        <Link to="/baby/immunisations" className="card card--link imm-home">
          <span className="hub__icon" aria-hidden="true">
            💉
          </span>
          <span className="hub__text">
            <span className="hub__title">Next immunisations: {nextJab.visit.label}</span>
            <span className="hub__desc">
              {nextJab.due < today ? 'Was due' : 'Due'} {formatDisplayDate(nextJab.due)}
            </span>
          </span>
          <span className="hub__chevron" aria-hidden="true">
            ›
          </span>
        </Link>
      )}
      <HubList items={BABY_TOOLS} />
      <CallCard title="Help with your baby" lines={[PLUNKETLINE, HEALTHLINE, EMERGENCY]} />
      <section aria-labelledby="keepsakes-heading">
        <h2 id="keepsakes-heading">Your pregnancy</h2>
        <HubList items={KEEPSAKES} />
      </section>
    </Page>
  );
}

/** Home after a pregnancy has ended: no pregnancy content, support lines, and the user's data left alone. */
export function EndedHome() {
  return (
    <Page title="Home" icon="🤍" footer={footer} health={false}>
      <section className="card" aria-labelledby="ended-heading">
        <h2 id="ended-heading">We’re so sorry</h2>
        <p>Bump Tracker has stopped showing pregnancy updates. There’s no right way to feel, and support is there whenever you want it.</p>
      </section>
      <CallCard title="Support" lines={[NEED_TO_TALK, SANDS, MISCARRIAGE_SUPPORT, HEALTHLINE, EMERGENCY]} />
      <section className="card" aria-labelledby="ended-data-heading">
        <h2 id="ended-data-heading">Your data</h2>
        <p>Everything you logged stays on this device. You can keep it, back it up, or delete it, whenever you’re ready.</p>
        <div className="button-row">
          <Link to="/more/data" className="btn btn--ghost">
            Your data
          </Link>
          <Link to="/settings" className="btn btn--ghost">
            Settings
          </Link>
        </div>
      </section>
    </Page>
  );
}
