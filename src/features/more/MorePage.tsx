import { HubList, type HubItem } from '../../components/HubList';
import { Page } from '../../components/Page';

export const MORE_ITEMS: readonly HubItem[] = [
  { to: '/more/warning-signs', title: 'When to call', description: 'Warning signs and phone numbers', icon: '📞' },
  { to: '/more/partner', title: 'Partner summary', description: 'A quick catch-up to share', icon: '💞' },
  { to: '/more/print', title: 'Print summary', description: 'A printable summary for appointments', icon: '🖨️' },
  { to: '/settings', title: 'Settings', description: 'Due date, nickname, care team numbers', icon: '⚙️' },
  { to: '/more/data', title: 'Your data', description: 'Back up, import or delete', icon: '💾' },
  { to: '/more/sync', title: 'Sync', description: 'Use your data on more than one device', icon: '🔄' },
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
