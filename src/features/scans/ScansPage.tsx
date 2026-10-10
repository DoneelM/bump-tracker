import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): list of scans and appointments with notes.
export function ScansPage() {
  return (
    <PlaceholderPage
      title="Scans & appointments"
      icon="🩺"
      back={{ to: '/tools', label: 'Tools' }}
      description="Keep a record of your scans, LMC visits and questions to ask."
    />
  );
}
