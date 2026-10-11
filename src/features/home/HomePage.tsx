import { Link } from '../../app/router';
import { HelpRow } from '../../components/CallCard';
import { GuidanceCard } from '../../components/GuidanceCard';
import { Page } from '../../components/Page';
import { PAST_DUE, PAST_DUE_OVERDUE_LINE } from '../../data/guidance';
import { ProgressBar } from '../../components/ProgressBar';
import { SizeComparison } from '../../components/SizeComparison';
import { clampGuideWeek, getWeekInfo } from '../../data/weeks';
import { formatDisplayDate, type LocalDate } from '../../lib/dates';
import {
  daysUntilDue,
  formatWeeksDays,
  gestationalAge,
  pastDueLevel,
  progressFraction,
  TRIMESTER_LABEL,
  trimester,
} from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import { KICKS_UNLOCK_WEEK } from '../../lib/kicks';
import { nextAppointment, parseScanEntries, scanTypeLabel, type ScanEntry } from '../../lib/scans';
import { STORAGE_KEYS } from '../../lib/storage';
import { SyncPromo } from '../sync/SyncPromo';
import { ComingUpCard } from './ComingUpCard';
import { BornHome, EndedHome } from './EndingHome';
import { useStoredState } from '../../lib/useStoredState';
import { parseWeightEntries, sortByDate, type WeightEntry } from '../../lib/weightGain';

const NO_WEIGHTS: WeightEntry[] = [];
const NO_SCANS: ScanEntry[] = [];

export function HomePage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  if (profile.ending?.kind === 'born') return <BornHome profile={profile} ending={profile.ending} />;
  if (profile.ending?.kind === 'ended') return <EndedHome />;
  return <PregnancyHome profile={profile} today={today} />;
}

/**
 * From here Home turns practical: help first, then the contraction timer. A layout choice, not a
 * clinical threshold.
 */
const LATE_STAGE_WEEK = 36;

/** Week labels under the progress bar, placed at their true position on the 40-week scale. */
const SCALE_WEEKS = [0, 14, 28, 40] as const;

function PregnancyHome({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const ga = gestationalAge(profile.dueDate, today);
  const daysLeft = daysUntilDue(profile.dueDate, today);
  const pastDue = pastDueLevel(daysLeft);
  const tri = trimester(ga.totalDays);
  const beforeLmp = ga.totalDays < 0;
  const guideWeek = clampGuideWeek(ga.weeks);
  const weekInfo = getWeekInfo(guideWeek);
  const name = profile.nickname || 'your baby';
  const late = ga.weeks >= LATE_STAGE_WEEK;
  const [weights] = useStoredState<WeightEntry[]>(STORAGE_KEYS.weightEntries, NO_WEIGHTS, parseWeightEntries);
  const [scans] = useStoredState<ScanEntry[]>(STORAGE_KEYS.scanEntries, NO_SCANS, parseScanEntries);
  const latestWeight = sortByDate(weights).at(-1);
  const next = nextAppointment(scans, today);

  const countdown =
    daysLeft > 0
      ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go`
      : daysLeft === 0
        ? 'Due today 💛'
        : `${-daysLeft} ${daysLeft === -1 ? 'day' : 'days'} past your due date`;

  const hero = (
    <section className="card hero" aria-labelledby="hero-heading">
      <h2 id="hero-heading" className="hero__ga">
        {beforeLmp ? 'Not started yet' : formatWeeksDays(ga.weeks, ga.days)}
      </h2>
      <p className="hero__meta">
        <span className="hero__tri">{TRIMESTER_LABEL[tri]}</span> · {countdown}
      </p>
      <ProgressBar
        value={progressFraction(ga.totalDays)}
        label="Pregnancy progress"
        valueText={`${formatWeeksDays(Math.max(0, ga.weeks), Math.max(0, ga.days))} of 40 weeks`}
      />
      <p className="hero__scale" aria-hidden="true">
        {SCALE_WEEKS.map((w) => (
          <span key={w} style={{ left: `${(w / 40) * 100}%` }}>
            {w === 40 ? '40 wks' : w}
          </span>
        ))}
      </p>
      <p className="muted">Due {formatDisplayDate(profile.dueDate)}</p>
    </section>
  );

  const pastDueCard = pastDue !== 'none' && (
    <GuidanceCard g={{ ...PAST_DUE, body: pastDue === 'overdue' ? `${PAST_DUE.body} ${PAST_DUE_OVERDUE_LINE}` : PAST_DUE.body }} />
  );

  const weekCard = (
    <Link to={`/weeks/${guideWeek}`} className="card card--link week-card">
      <span className="week-card__text">
        <span className="week-card__title">Week {guideWeek} guide</span>
        <span className="week-card__desc">
          What’s happening with you and {name} this week
        </span>
      </span>
      {weekInfo ? (
        <SizeComparison info={weekInfo} size={96} />
      ) : (
        <span className="week-card__emoji" aria-hidden="true">
          📖
        </span>
      )}
      <span className="hub__chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  );

  const quickActions = (
    <section className="card" aria-labelledby="quick-heading">
      <h2 id="quick-heading">Quick actions</h2>
      {ga.weeks === KICKS_UNLOCK_WEEK && <p className="muted">New from {KICKS_UNLOCK_WEEK} weeks: the kick counter.</p>}
      <div className="button-row">
        <Link to="/tools/contractions" className={`btn ${late ? 'btn--primary' : 'btn--ghost'}`}>
          Start contraction timer
        </Link>
        {ga.weeks >= KICKS_UNLOCK_WEEK && (
          <Link to="/tools/kicks" className="btn btn--ghost">
            Kick counter
          </Link>
        )}
        <Link to="/journal" className="btn btn--ghost">
          Log symptom
        </Link>
      </div>
    </section>
  );

  // Only tiles with something to show; empty ones were dead weight (the logs are a tap away in Tools).
  const tiles = (latestWeight || next) && (
    <div className="summary-grid">
      {latestWeight && (
        <Link to="/tools/weight" className="card card--link summary-tile">
          <span className="summary-tile__label">Latest weight</span>
          <span className="summary-tile__value">{Math.round(latestWeight.weightKg * 10) / 10} kg</span>
          <span className="muted">{formatDisplayDate(latestWeight.date)}</span>
        </Link>
      )}
      {next && (
        <Link to="/tools/scans" className="card card--link summary-tile">
          <span className="summary-tile__label">Next appointment</span>
          <span className="summary-tile__value">{scanTypeLabel(next.type)}</span>
          <span className="muted">{formatDisplayDate(next.date)}</span>
        </Link>
      )}
    </div>
  );

  const comingUp = <ComingUpCard dueDate={profile.dueDate} today={today} />;

  return (
    <Page
      title="Home"
      hideTitle
      footer={
        <div className="page-footer">
          <p>Your data stays on this device unless you turn on sync.</p>
          <a href="./privacy.html" className="text-link">
            Privacy policy
          </a>
        </div>
      }
    >
      {late ? (
        <>
          <HelpRow />
          {hero}
          {pastDueCard}
          {quickActions}
          {comingUp}
          {tiles}
          {weekCard}
        </>
      ) : (
        <>
          {hero}
          <HelpRow />
          {weekCard}
          {comingUp}
          {tiles}
          {quickActions}
        </>
      )}
      <SyncPromo />
    </Page>
  );
}
