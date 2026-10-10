import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): baby movement log. Any guidance text must be sourced (see src/data/sources.ts).
export function KicksPage() {
  return (
    <PlaceholderPage
      title="Kicks"
      icon="👣"
      back={{ to: '/tools', label: 'Tools' }}
      description="Get to know your baby’s pattern of movements."
    />
  );
}
