import { Page } from '../../components/Page';
import { SOURCES } from '../../data/sources';

export function SourcesPage() {
  return (
    <Page title="Sources" icon="📚" back={{ to: '/more', label: 'More' }}>
      <section className="card">
        {SOURCES.length === 0 ? (
          <p>Sources will be listed here as guide content is added.</p>
        ) : (
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
                ({s.publisher}, accessed {s.accessed})
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
