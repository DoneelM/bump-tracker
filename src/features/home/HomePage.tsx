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
  splitDays,
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
/** Labels under the progress bar, at their true positions (14 and 28 weeks are the trimester boundaries). */
const SCALE_WEEKS = [0, 14, 28, 40] as const;
/** The contraction timer joins the quick actions at term; before that it stays in Tools. */
const TIMER_QUICK_ACTION_WEEK = 37;

export function HomePage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  if (profile.ending?.kind === 'born') return <BornHome profile={profile} ending={profile.ending} />;
  if (profile.ending?.kind === 'ended') return <EndedHome />;
  return <PregnancyHome profile={profile} today={today} />;
}

function PregnancyHome({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
  const ga = gestationalAge(profile.dueDate, today);
  const daysLeft = daysUntilDue(profile.dueDate, today);
  const pastDue = pastDueLevel(daysLeft);
  const left = splitDays(Math.max(0, daysLeft));
  const tri = trimester(ga.totalDays);
  const beforeLmp = ga.totalDays < 0;
  const guideWeek = clampGuideWeek(ga.weeks);
  const weekInfo = getWeekInfo(guideWeek);
  const name = profile.nickname || 'Baby';
  const [weights] = useStoredState<WeightEntry[]>(STORAGE_KEYS.weightEntries, NO_WEIGHTS, parseWeightEntries);
  const [scans] = useStoredState<ScanEntry[]>(STORAGE_KEYS.scanEntries, NO_SCANS, parseScanEntries);
  const latestWeight = sortByDate(weights).at(-1);
  const next = nextAppointment(scans, today);

  return (
    <Page
      title="Home"
      hideTitle
      footer={
        <p className="page-footer">
          <a href="./privacy.html" className="text-link">
            Privacy policy
          </a>
        </p>
      }
    >
      <section className="card hero" aria-labelledby="hero-heading">
        <p className="hero__eyebrow">{TRIMESTER_LABEL[tri]}</p>
        <h2 id="hero-heading" className="hero__ga">
          {beforeLmp ? 'Not started yet' : formatWeeksDays(ga.weeks, ga.days)}
        </h2>
        <ProgressBar
          value={progressFraction(ga.totalDays)}
          label="Pregnancy progress"
          valueText={`${Math.max(0, ga.weeks)} of 40 weeks`}
        />
        <p className="hero__scale" aria-hidden="true">
          {SCALE_WEEKS.map((w) => (
            <span key={w} style={{ left: `${(w / 40) * 100}%` }}>
              {w === 40 ? '40 wks' : w}
            </span>
          ))}
        </p>
        <p className="hero__countdown">
          {daysLeft > 0 ? (
            <>
              <span className="hero__days">{daysLeft}</span> {daysLeft === 1 ? 'day' : 'days'} until you meet {name}
            </>
          ) : daysLeft === 0 ? (
            'Today is your due date! 💛'
          ) : (
            `Your due date was ${-daysLeft} ${daysLeft === -1 ? 'day' : 'days'} ago.`
          )}
        </p>
        <p className="muted">
          {daysLeft > 0 && `${formatWeeksDays(left.weeks, left.days)} to go. `}Due {formatDisplayDate(profile.dueDate)}
        </p>
      </section>

      {pastDue !== 'none' && (
        <GuidanceCard g={{ ...PAST_DUE, body: pastDue === 'overdue' ? `${PAST_DUE.body} ${PAST_DUE_OVERDUE_LINE}` : PAST_DUE.body }} />
      )}

      <Link to={`/weeks/${guideWeek}`} className="card card--link week-feature">
        <span className="week-feature__head">
          <span className="week-feature__title">Week {guideWeek} guide</span>
          <span className="hub__chevron" aria-hidden="true">
            ›
          </span>
        </span>
        {weekInfo && <SizeComparison info={weekInfo} size={112} />}
      </Link>

      <HelpRow />

      <nav className="quick-actions" aria-label="Quick actions">
        {ga.weeks >= TIMER_QUICK_ACTION_WEEK && (
          <Link to="/tools/contractions" className="btn btn--primary">
            Contraction timer
          </Link>
        )}
        {ga.weeks >= KICKS_UNLOCK_WEEK && (
          <Link to="/tools/kicks" className="btn btn--ghost">
            Kick counter
          </Link>
        )}
        <Link to="/journal" className="btn btn--ghost">
          Log symptom
        </Link>
      </nav>

      <div className="summary-grid">
        <Link to="/tools/weight" className="card card--link summary-tile">
          <span className="summary-tile__label">Latest weight</span>
          {latestWeight ? (
            <>
              <span className="summary-tile__value">{Math.round(latestWeight.weightKg * 10) / 10} kg</span>
              <span className="muted">{formatDisplayDate(latestWeight.date)}</span>
            </>
          ) : (
            <span className="muted">Nothing logged yet</span>
          )}
        </Link>
        <Link to="/tools/scans" className="card card--link summary-tile">
          <span className="summary-tile__label">Next appointment</span>
          {next ? (
            <>
              <span className="summary-tile__value">{scanTypeLabel(next.type)}</span>
              <span className="muted">{formatDisplayDate(next.date)}</span>
            </>
          ) : (
            <span className="muted">None planned yet</span>
          )}
        </Link>
      </div>

      <ComingUpCard dueDate={profile.dueDate} today={today} />

      <SyncPromo />
    </Page>
  );
}
