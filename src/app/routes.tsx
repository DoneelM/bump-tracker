import type { ReactNode } from 'react';
import { clampGuideWeek, FIRST_GUIDE_WEEK, LAST_GUIDE_WEEK } from '../data/weeks';
import { AboutPage } from '../features/about/AboutPage';
import { ChecklistsPage } from '../features/checklists/ChecklistsPage';
import { ContractionsPage } from '../features/contractions/ContractionsPage';
import { DataPage } from '../features/data/DataPage';
import { HomePage } from '../features/home/HomePage';
import { JournalPage } from '../features/journal/JournalPage';
import { KicksPage } from '../features/kicks/KicksPage';
import { MorePage } from '../features/more/MorePage';
import { NotFoundPage } from '../features/notfound/NotFoundPage';
import { PartnerPage } from '../features/partner/PartnerPage';
import { PhotosPage } from '../features/photos/PhotosPage';
import { PrintPage } from '../features/print/PrintPage';
import { ScansPage } from '../features/scans/ScansPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SourcesPage } from '../features/sources/SourcesPage';
import { ToolsPage } from '../features/tools/ToolsPage';
import { WeekDetailPage } from '../features/weeks/WeekDetailPage';
import { WeeksPage } from '../features/weeks/WeeksPage';
import { WeightPage } from '../features/weight/WeightPage';
import { gestationalAge } from '../lib/pregnancy';
import type { PregnancyProfile } from '../lib/profile';
import { matchPath, type RouteParams } from '../lib/route';

export type TabId = 'home' | 'weeks' | 'tools' | 'journal' | 'more';

export interface RouteContext {
  params: RouteParams;
  profile: PregnancyProfile;
  today: string;
}

interface RouteDef {
  pattern: string;
  tab: TabId;
  render: (ctx: RouteContext) => ReactNode;
}

function parseWeekParam(raw: string | undefined): number | null {
  if (!raw || !/^\d{1,2}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= FIRST_GUIDE_WEEK && n <= LAST_GUIDE_WEEK ? n : null;
}

/** Add new screens here. Order matters only for overlapping patterns. */
export const ROUTES: readonly RouteDef[] = [
  { pattern: '/', tab: 'home', render: ({ profile }) => <HomePage profile={profile} /> },
  {
    pattern: '/weeks',
    tab: 'weeks',
    render: ({ profile, today }) => (
      <WeeksPage currentWeek={clampGuideWeek(gestationalAge(profile.dueDate, today).weeks)} />
    ),
  },
  {
    pattern: '/weeks/:week',
    tab: 'weeks',
    render: ({ params }) => {
      const week = parseWeekParam(params.week);
      return week === null ? <NotFoundPage /> : <WeekDetailPage key={week} week={week} />;
    },
  },
  { pattern: '/tools', tab: 'tools', render: () => <ToolsPage /> },
  { pattern: '/tools/weight', tab: 'tools', render: () => <WeightPage /> },
  { pattern: '/tools/contractions', tab: 'tools', render: () => <ContractionsPage /> },
  { pattern: '/tools/scans', tab: 'tools', render: () => <ScansPage /> },
  { pattern: '/tools/kicks', tab: 'tools', render: () => <KicksPage /> },
  { pattern: '/tools/photos', tab: 'tools', render: () => <PhotosPage /> },
  { pattern: '/tools/checklists', tab: 'tools', render: () => <ChecklistsPage /> },
  { pattern: '/journal', tab: 'journal', render: () => <JournalPage /> },
  { pattern: '/more', tab: 'more', render: () => <MorePage /> },
  { pattern: '/more/partner', tab: 'more', render: () => <PartnerPage /> },
  { pattern: '/more/print', tab: 'more', render: () => <PrintPage /> },
  { pattern: '/more/data', tab: 'more', render: () => <DataPage /> },
  { pattern: '/more/sources', tab: 'more', render: () => <SourcesPage /> },
  { pattern: '/more/about', tab: 'more', render: () => <AboutPage /> },
  { pattern: '/settings', tab: 'more', render: () => <SettingsPage /> },
];

export function resolveRoute(path: string): { route: RouteDef; params: RouteParams } | null {
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}
