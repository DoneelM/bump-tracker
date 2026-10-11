import { Link } from '../app/router';
import type { TabId } from '../app/routes';
import { Icon } from './Icon';

type Tab = { id: TabId; to: string; label: string };

const PREGNANCY_TABS: readonly Tab[] = [
  { id: 'home', to: '/', label: 'Home' },
  { id: 'weeks', to: '/weeks', label: 'Weeks' },
  { id: 'tools', to: '/tools', label: 'Tools' },
  { id: 'journal', to: '/journal', label: 'Journal' },
  { id: 'more', to: '/more', label: 'More' },
];

/** Once the baby is born: the log and emergency help take the places of Weeks and Tools (Tools stays in More). */
const BABY_TABS: readonly Tab[] = [
  { id: 'home', to: '/', label: 'Home' },
  { id: 'baby', to: '/baby', label: 'Baby log' },
  { id: 'help', to: '/help', label: 'Help' },
  { id: 'journal', to: '/journal', label: 'Journal' },
  { id: 'more', to: '/more', label: 'More' },
];

/** Bottom tab bar on mobile; becomes a top bar on wider screens (see layout.css). */
export function BottomNav({ active, babyMode = false }: { active: TabId | null; babyMode?: boolean }) {
  const tabs = babyMode ? BABY_TABS : PREGNANCY_TABS;
  // Tools pages live under More in baby mode, so highlight More there.
  const current = babyMode && active === 'tools' ? 'more' : active;
  return (
    <nav className="tabbar" aria-label="Main">
      <ul className="tabbar__list">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <Link
              to={tab.to}
              className={`tabbar__link${current === tab.id ? ' is-active' : ''}`}
              aria-current={current === tab.id ? 'page' : undefined}
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
