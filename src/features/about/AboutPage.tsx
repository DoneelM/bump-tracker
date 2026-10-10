import { Page } from '../../components/Page';

export function AboutPage() {
  return (
    <Page title="About" icon="💡" back={{ to: '/more', label: 'More' }}>
      <section className="card">
        <h2>Bump Tracker</h2>
        <p>A demo pregnancy tracker made with aroha in Tāmaki Makaurau Auckland.</p>
      </section>
      <section className="card">
        <h2>Your privacy</h2>
        <ul className="bullets">
          <li>No accounts, no servers, no analytics, no trackers.</li>
          <li>Your details are stored only in this browser on this device.</li>
          <li>Clearing your browser data will delete them, so back up from “Your data”.</li>
        </ul>
      </section>
    </Page>
  );
}
