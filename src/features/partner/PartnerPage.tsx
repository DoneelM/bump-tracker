import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): read-only summary for a partner (week, countdown, upcoming appointments).
export function PartnerPage() {
  return (
    <PlaceholderPage
      title="Partner summary"
      icon="💞"
      back={{ to: '/more', label: 'More' }}
      description="A quick, friendly catch-up on how things are going, to show your partner or whānau."
    />
  );
}
