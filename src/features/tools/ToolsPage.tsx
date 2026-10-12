import { HubList, type HubItem } from '../../components/HubList';
import { Page } from '../../components/Page';
import type { PregnancyEnding } from '../../lib/profile';

export const TOOL_ITEMS: readonly HubItem[] = [
  { to: '/tools/timeline', title: 'Timeline', description: 'Checks, tests and vaccines, with calendar dates', icon: '🗓️' },
  { to: '/tools/weight', title: 'Weight', description: 'Log your weight over time', icon: '⚖️' },
  { to: '/tools/contractions', title: 'Contractions', description: 'Time contractions and gaps', icon: '⏱️' },
  { to: '/tools/scans', title: 'Scans & appointments', description: 'Keep track of scans and visits', icon: '🩺' },
  { to: '/tools/kicks', title: 'Kicks', description: 'Notice baby’s movements', icon: '👣' },
  { to: '/tools/photos', title: 'Bump photos', description: 'A private photo diary of your bump', icon: '📸' },
  { to: '/tools/bp', title: 'Blood pressure', description: 'If your care team asked you to check at home', icon: '💓' },
  { to: '/tools/glucose', title: 'Glucose', description: 'If your care team asked you to check at home', icon: '🩸' },
  { to: '/tools/checklists', title: 'Checklists', description: 'Hospital bag and birth plan', icon: '✅' },
  { to: '/baby', title: 'Baby log', description: 'Feeds, nappies and sleep', icon: '🍼' },
  { to: '/baby/immunisations', title: 'Immunisations', description: 'Due dates and what’s given', icon: '💉' },
  { to: '/tools/names', title: 'Baby names', description: 'Your private shortlist', icon: '🏷️' },
  { to: '/tools/food', title: 'Food safety', description: 'What’s OK to eat, from NZ Food Safety', icon: '🥗' },
  { to: '/tools/supplements', title: 'Supplements', description: 'Tick off folic acid, iodine and more', icon: '💊' },
];

/** Pregnancy-only tools, hidden once the pregnancy has ended (birth or loss). Their pages still open by link. */
const PREGNANCY_ONLY = new Set(['/tools/timeline', '/tools/contractions', '/tools/kicks', '/tools/names']);
/** Shown only once the baby is born. */
const BORN_ONLY = new Set(['/baby', '/baby/immunisations']);

export function ToolsPage({ ending }: { ending?: PregnancyEnding['kind'] }) {
  const items = TOOL_ITEMS.filter((i) => (ending ? !PREGNANCY_ONLY.has(i.to) : true) && (BORN_ONLY.has(i.to) ? ending === 'born' : true));
  return (
    <Page title="Tools" icon="🧰" health={false}>
      <HubList items={items} />
    </Page>
  );
}
