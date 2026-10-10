import { Page } from './Page';

interface PlaceholderPageProps {
  title: string;
  icon?: string;
  description: string;
  back?: { to: string; label: string };
  health?: boolean;
}

/** Stand-in for screens that will be built in later iterations. */
export function PlaceholderPage({ title, icon, description, back, health }: PlaceholderPageProps) {
  return (
    <Page title={title} icon={icon} back={back} health={health}>
      <section className="card card--soft">
        <p>{description}</p>
        <p className="coming-soon">
          <span aria-hidden="true">🌱</span> Coming soon
        </p>
      </section>
    </Page>
  );
}
