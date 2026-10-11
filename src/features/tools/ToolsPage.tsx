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
  { to: '/tools/names', title: 'Baby names', description: 'Your private shortlist', icon: '🏷️' },
];

/** Pregnancy-only tools, hidden once the pregnancy has ended (birth or loss). Their pages still open by link. */
const PREGNANCY_ONLY = new Set(['/tools/timeline', '/tools/contractions', '/tools/kicks']);

export function ToolsPage({ ending }: { ending?: PregnancyEnding['kind'] }) {
  const items = ending ? TOOL_ITEMS.filter((i) => !PREGNANCY_ONLY.has(i.to)) : TOOL_ITEMS;
  return (
    <Page title="Tools" icon="🧰" health={false}>
      <HubList items={items} />
    </Page>
  );
}
