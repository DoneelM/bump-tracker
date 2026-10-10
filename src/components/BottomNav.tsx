import { Link } from '../app/router';
import type { TabId } from '../app/routes';
import { Icon } from './Icon';

const TABS: readonly { id: TabId; to: string; label: string }[] = [
  { id: 'home', to: '/', label: 'Home' },
  { id: 'weeks', to: '/weeks', label: 'Weeks' },
  { id: 'tools', to: '/tools', label: 'Tools' },
  { id: 'journal', to: '/journal', label: 'Journal' },
  { id: 'more', to: '/more', label: 'More' },
];

/** Bottom tab bar on mobile; becomes a top bar on wider screens (see layout.css). */
export function BottomNav({ active }: { active: TabId | null }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <ul className="tabbar__list">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <Link
              to={tab.to}
              className={`tabbar__link${active === tab.id ? ' is-active' : ''}`}
              aria-current={active === tab.id ? 'page' : undefined}
            >
              <Icon name={tab.id} />
              <span className="tabbar__label">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
