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
          <li>No accounts with us, no servers, no analytics, no trackers.</li>
          <li>Your details are stored in this browser on this device.</li>
          <li>
            If you turn on sync, an encrypted copy is kept in a hidden app folder in your own Google Drive. Only your devices can read it.
            We store nothing. See the <a href="./privacy.html">privacy policy</a>.
          </li>
          <li>Clearing your browser data will delete them, so back up from “Your data”.</li>
        </ul>
      </section>
    </Page>
  );
}
