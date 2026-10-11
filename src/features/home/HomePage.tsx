import { Link } from '../../app/router';
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
import { useStoredState } from '../../lib/useStoredState';
import { parseWeightEntries, sortByDate, type WeightEntry } from '../../lib/weightGain';

const NO_WEIGHTS: WeightEntry[] = [];
const NO_SCANS: ScanEntry[] = [];

export function HomePage({ profile, today }: { profile: PregnancyProfile; today: LocalDate }) {
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
    <Page title="Home" icon="🏡">
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
          <span>0</span>
          <span>14</span>
          <span>28</span>
          <span>40 wks</span>
        </p>
      </section>

      <section className="card countdown" aria-labelledby="countdown-heading">
        <h2 id="countdown-heading">Countdown to {name}</h2>
        {daysLeft > 0 ? (
          <p className="countdown__numbers">
            <span className="countdown__big">{daysLeft}</span> {daysLeft === 1 ? 'day' : 'days'} to go
            <span className="countdown__sub">({formatWeeksDays(left.weeks, left.days)})</span>
          </p>
        ) : daysLeft === 0 ? (
          <p className="countdown__numbers">Today is your due date! 💛</p>
        ) : (
          <p className="countdown__numbers">
            Your due date was {-daysLeft} {daysLeft === -1 ? 'day' : 'days'} ago.
          </p>
        )}
        <p className="muted">Estimated due date: {formatDisplayDate(profile.dueDate)}</p>
        <Link to="/settings" className="text-link">
          Change dates
        </Link>
      </section>

      {pastDue !== 'none' && (
        <GuidanceCard g={{ ...PAST_DUE, body: pastDue === 'overdue' ? `${PAST_DUE.body} ${PAST_DUE_OVERDUE_LINE}` : PAST_DUE.body }} />
      )}

      <Link to={`/weeks/${guideWeek}`} className="card card--link week-card">
        {weekInfo ? (
          <SizeComparison info={weekInfo} size={96} />
        ) : (
          <span className="week-card__emoji" aria-hidden="true">
            📖
          </span>
        )}
        <span>
          <span className="week-card__title">Week {guideWeek} guide</span>
          <span className="week-card__desc">What’s happening with you and {name} this week</span>
        </span>
        <span className="hub__chevron" aria-hidden="true">
          ›
        </span>
      </Link>

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
            <span className="muted">None planned. Add one in your scans log.</span>
          )}
        </Link>
      </div>

      <section className="card" aria-labelledby="quick-heading">
        <h2 id="quick-heading">Quick actions</h2>
        <div className="button-row">
          <Link to="/tools/contractions" className="btn btn--ghost">
            Start contraction timer
          </Link>
          <Link to="/journal" className="btn btn--ghost">
            Log symptom
          </Link>
          {ga.weeks >= KICKS_UNLOCK_WEEK && (
            <Link to="/tools/kicks" className="btn btn--ghost">
              Kick counter
            </Link>
          )}
        </div>
      </section>
    </Page>
  );
}
