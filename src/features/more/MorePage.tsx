import { HubList, type HubItem } from '../../components/HubList';
import { Page } from '../../components/Page';

export const MORE_ITEMS: readonly HubItem[] = [
  { to: '/more/partner', title: 'Partner summary', description: 'A quick catch-up to share', icon: '💞' },
  { to: '/more/print', title: 'Print summary', description: 'A printable summary for appointments', icon: '🖨️' },
  { to: '/settings', title: 'Settings', description: 'Due date and baby’s nickname', icon: '⚙️' },
  { to: '/more/data', title: 'Your data', description: 'Back up, import or delete', icon: '💾' },
  { to: '/more/sources', title: 'Sources', description: 'Where our information comes from', icon: '📚' },
  { to: '/more/about', title: 'About', description: 'Privacy and how this app works', icon: '💡' },
];

export function MorePage() {
  return (
    <Page title="More" icon="✨" health={false}>
      <HubList items={MORE_ITEMS} />
    </Page>
  );
}
