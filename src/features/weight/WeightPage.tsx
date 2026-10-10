import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): weight log with Recharts trend chart, stored via useStoredState.
export function WeightPage() {
  return (
    <PlaceholderPage
      title="Weight"
      icon="⚖️"
      back={{ to: '/tools', label: 'Tools' }}
      description="Log your weight and see how it changes over your pregnancy."
    />
  );
}
