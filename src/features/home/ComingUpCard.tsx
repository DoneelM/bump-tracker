import { Link } from '../../app/router';
import type { LocalDate } from '../../lib/dates';
import { comingUp } from '../../lib/timeline';

/** Home: the current and next antenatal milestones, linking to the full timeline. */
export function ComingUpCard({ dueDate, today }: { dueDate: LocalDate; today: LocalDate }) {
  const items = comingUp(dueDate, today);
  if (!items.length) return null;
  return (
    <section className="card" aria-labelledby="coming-heading">
      <h2 id="coming-heading">Coming up</h2>
      <ul className="bullets">
        {items.map((p) => (
          <li key={p.milestone.id}>
            <strong>{p.milestone.title}</strong>
            {p.milestone.optional && ' (optional)'}: {p.milestone.when.charAt(0).toLowerCase() + p.milestone.when.slice(1)}
          </li>
        ))}
      </ul>
      <Link to="/tools/timeline" className="text-link">
        See your timeline
      </Link>
    </section>
  );
}
