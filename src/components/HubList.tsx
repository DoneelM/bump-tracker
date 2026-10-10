import { Link } from '../app/router';

export interface HubItem {
  to: string;
  title: string;
  description: string;
  icon: string;
}

/** Grid of large, tappable cards linking to sub-screens (Tools, More). */
export function HubList({ items }: { items: readonly HubItem[] }) {
  return (
    <ul className="hub">
      {items.map((item) => (
        <li key={item.to}>
          <Link to={item.to} className="hub__item">
            <span className="hub__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="hub__text">
              <span className="hub__title">{item.title}</span>
              <span className="hub__desc">{item.description}</span>
            </span>
            <span className="hub__chevron" aria-hidden="true">
              ›
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
