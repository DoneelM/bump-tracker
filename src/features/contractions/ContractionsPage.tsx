import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): contraction timer (start/stop, duration, interval history).
export function ContractionsPage() {
  return (
    <PlaceholderPage
      title="Contractions"
      icon="⏱️"
      back={{ to: '/tools', label: 'Tools' }}
      description="Time how long your contractions last and how far apart they are."
    />
  );
}
