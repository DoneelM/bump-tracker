import { HubList, type HubItem } from '../../components/HubList';
import { Page } from '../../components/Page';

export const TOOL_ITEMS: readonly HubItem[] = [
  { to: '/tools/timeline', title: 'Timeline', description: 'Checks, tests and vaccines, with calendar dates', icon: '🗓️' },
  { to: '/tools/weight', title: 'Weight', description: 'Log your weight over time', icon: '⚖️' },
  { to: '/tools/contractions', title: 'Contractions', description: 'Time contractions and gaps', icon: '⏱️' },
  { to: '/tools/scans', title: 'Scans & appointments', description: 'Keep track of scans and visits', icon: '🩺' },
  { to: '/tools/kicks', title: 'Kicks', description: 'Notice baby’s movements', icon: '👣' },
  { to: '/tools/photos', title: 'Bump photos', description: 'A private photo diary of your bump', icon: '📸' },
  { to: '/tools/checklists', title: 'Checklists', description: 'Hospital bag and birth plan', icon: '✅' },
];

export function ToolsPage() {
  return (
    <Page title="Tools" icon="🧰" health={false}>
      <HubList items={TOOL_ITEMS} />
    </Page>
  );
}
