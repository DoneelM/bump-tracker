import { Link } from '../../app/router';
import { Page } from '../../components/Page';
import { ProgressBar } from '../../components/ProgressBar';
import { clampGuideWeek, getWeekInfo } from '../../data/weeks';
import { formatDisplayDate } from '../../lib/dates';
import {
  daysUntilDue,
  formatWeeksDays,
  gestationalAge,
  progressFraction,
  splitDays,
  trimester,
} from '../../lib/pregnancy';
import type { PregnancyProfile } from '../../lib/profile';
import { useToday } from '../../lib/useToday';

const TRIMESTER_LABEL = { 1: 'First trimester', 2: 'Second trimester', 3: 'Third trimester' } as const;

export function HomePage({ profile }: { profile: PregnancyProfile }) {
  const today = useToday();
  const ga = gestationalAge(profile.dueDate, today);
  const daysLeft = daysUntilDue(profile.dueDate, today);
  const left = splitDays(Math.max(0, daysLeft));
  const tri = trimester(ga.totalDays);
  const beforeLmp = ga.totalDays < 0;
  const guideWeek = clampGuideWeek(ga.weeks);
  const weekInfo = getWeekInfo(guideWeek);
  const name = profile.nickname || 'Baby';

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

      <Link to={`/weeks/${guideWeek}`} className="card card--link week-card">
        <span className="week-card__emoji" aria-hidden="true">
          {weekInfo?.sizeEmoji ?? '📖'}
        </span>
        <span>
          <span className="week-card__title">Week {guideWeek} guide</span>
          <span className="week-card__desc">What’s happening with you and {name} this week</span>
        </span>
        <span className="hub__chevron" aria-hidden="true">
          ›
        </span>
      </Link>
    </Page>
  );
}
