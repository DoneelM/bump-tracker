import { Page } from '../../components/Page';
import { SyncPanel } from './SyncPanel';

export function SyncPage() {
  return (
    <Page title="Sync" icon="🔄" back={{ to: '/more', label: 'More' }} health={false}>
      <SyncPanel />
    </Page>
  );
}
