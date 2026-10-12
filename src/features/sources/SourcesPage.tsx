import { Page } from '../../components/Page';
import { LICENCE_LABEL, SOURCES } from '../../data/sources';

export function SourcesPage() {
  return (
    <Page title="Sources" icon="📚" back={{ to: '/more', label: 'More' }}>
      <section className="card">
        <ul className="bullets">
          {SOURCES.map((s) => (
            <li key={s.id}>
              {/* Only ever link out over https (never javascript:/data: URLs). */}
              {s.url.startsWith('https://') ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
              ) : (
                s.title
              )}{' '}
              ({s.publisher}). <span className="muted">
                {s.usedFor} {LICENCE_LABEL[s.licence]}{s.changed ? ', adapted' : ''}.
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card card--soft">
        <p>
          Baby illustrations are AI-generated stylised art, not medical images. Week guides are plain-English
          paraphrases of the sources above.
        </p>
      </section>
    </Page>
  );
}
