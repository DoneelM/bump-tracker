import { PlaceholderPage } from '../../components/PlaceholderPage';

// TODO(feature): print-friendly summary (print stylesheet + window.print()).
export function PrintPage() {
  return (
    <PlaceholderPage
      title="Print summary"
      icon="🖨️"
      back={{ to: '/more', label: 'More' }}
      description="A printable summary of your dates and logs to bring to appointments."
    />
  );
}
