import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): JSON backup (storage.exportAll + photos), validated import, delete everything.
export function DataPage() {
  return (
    <PlaceholderPage
      title="Your data"
      icon="💾"
      back={{ to: '/more', label: 'More' }}
      health={false}
      description="Everything is stored only in this browser. Soon you’ll be able to back it up, restore it, or delete it all."
    />
  );
}
