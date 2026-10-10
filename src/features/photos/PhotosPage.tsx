import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): bump photo diary using src/lib/photoStore.ts (IndexedDB).
export function PhotosPage() {
  return (
    <PlaceholderPage
      title="Bump photos"
      icon="📸"
      back={{ to: '/tools', label: 'Tools' }}
      description="Keep a private photo diary of your growing bump. Photos stay on this device."
    />
  );
}
