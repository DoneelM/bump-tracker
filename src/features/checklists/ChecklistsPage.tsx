import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): checklists (content in src/data, progress in localStorage).
export function ChecklistsPage() {
  return (
    <PlaceholderPage
      title="Checklists"
      icon="✅"
      back={{ to: '/tools', label: 'Tools' }}
      description="Tick things off: hospital bag, nursery, birth preferences and more."
    />
  );
}
