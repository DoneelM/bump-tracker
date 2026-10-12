import type { ReactNode } from 'react';
import { clampGuideWeek, FIRST_GUIDE_WEEK, LAST_GUIDE_WEEK } from '../data/weeks';
import { AboutPage } from '../features/about/AboutPage';
import { ChecklistsPage } from '../features/checklists/ChecklistsPage';
import { ContractionsPage } from '../features/contractions/ContractionsPage';
import { DataPage } from '../features/data/DataPage';
import { WarningSignsPage } from '../features/help/WarningSignsPage';
import { HomePage } from '../features/home/HomePage';
import { JournalPage } from '../features/journal/JournalPage';
import { QuestionsPage } from '../features/questions/QuestionsPage';
import { KicksPage } from '../features/kicks/KicksPage';
import { MorePage } from '../features/more/MorePage';
import { NotFoundPage } from '../features/notfound/NotFoundPage';
import { PartnerPage } from '../features/partner/PartnerPage';
import { PhotosPage } from '../features/photos/PhotosPage';
import { PrintPage } from '../features/print/PrintPage';
import { ScansPage } from '../features/scans/ScansPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SourcesPage } from '../features/sources/SourcesPage';
import { SyncPage } from '../features/sync/SyncPage';
import { BabyNamesPage } from '../features/names/BabyNamesPage';
import { FoodSafetyPage } from '../features/food/FoodSafetyPage';
import { SupplementsPage } from '../features/supplements/SupplementsPage';
import { BabyLogPage } from '../features/babylog/BabyLogPage';
import { FeedbackPage } from '../features/feedback/FeedbackPage';
import { HelpPage } from '../features/help/HelpPage';
import { ImmunisationsPage } from '../features/immunisations/ImmunisationsPage';
import { BpPage } from '../features/monitoring/BpPage';
import { GlucosePage } from '../features/monitoring/GlucosePage';
import { TimelinePage } from '../features/timeline/TimelinePage';
import { ToolsPage } from '../features/tools/ToolsPage';
import { WeekDetailPage } from '../features/weeks/WeekDetailPage';
import { WeeksPage } from '../features/weeks/WeeksPage';
import { WeightPage } from '../features/weight/WeightPage';
import { gestationalAge } from '../lib/pregnancy';
import type { PregnancyProfile } from '../lib/profile';
import { matchPath, type RouteParams } from '../lib/route';

export type TabId = 'home' | 'weeks' | 'tools' | 'journal' | 'more' | 'baby' | 'help';

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
  { pattern: '/', tab: 'home', render: ({ profile, today }) => <HomePage profile={profile} today={today} /> },
  { pattern: '/baby', tab: 'baby', render: ({ profile }) => <BabyLogPage profile={profile} /> },
  { pattern: '/help', tab: 'help', render: () => <HelpPage /> },
  { pattern: '/baby/immunisations', tab: 'home', render: ({ profile, today }) => <ImmunisationsPage profile={profile} today={today} /> },
  {
    pattern: '/weeks',
    tab: 'weeks',
    render: ({ profile, today }) => (
      <WeeksPage
        currentWeek={clampGuideWeek(gestationalAge(profile.dueDate, today).weeks)}
        ending={profile.ending?.kind}
      />
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
  { pattern: '/tools', tab: 'tools', render: ({ profile }) => <ToolsPage ending={profile.ending?.kind} /> },
  { pattern: '/tools/weight', tab: 'tools', render: ({ profile, today }) => <WeightPage profile={profile} today={today} /> },
  { pattern: '/tools/contractions', tab: 'tools', render: ({ profile, today }) => <ContractionsPage profile={profile} today={today} /> },
  { pattern: '/tools/scans', tab: 'tools', render: ({ profile, today }) => <ScansPage profile={profile} today={today} /> },
  { pattern: '/tools/kicks', tab: 'tools', render: ({ profile, today }) => <KicksPage profile={profile} today={today} /> },
  { pattern: '/tools/photos', tab: 'tools', render: ({ profile, today }) => <PhotosPage profile={profile} today={today} /> },
  { pattern: '/tools/checklists', tab: 'tools', render: () => <ChecklistsPage /> },
  { pattern: '/tools/names', tab: 'tools', render: () => <BabyNamesPage /> },
  { pattern: '/tools/food', tab: 'tools', render: () => <FoodSafetyPage /> },
  { pattern: '/tools/supplements', tab: 'tools', render: ({ today }) => <SupplementsPage today={today} /> },
  { pattern: '/tools/bp', tab: 'tools', render: ({ today }) => <BpPage today={today} /> },
  { pattern: '/tools/glucose', tab: 'tools', render: ({ today }) => <GlucosePage today={today} /> },
  { pattern: '/tools/timeline', tab: 'tools', render: ({ profile, today }) => <TimelinePage profile={profile} today={today} /> },
  { pattern: '/journal', tab: 'journal', render: () => <JournalPage /> },
  { pattern: '/journal/questions', tab: 'journal', render: ({ today }) => <QuestionsPage today={today} /> },
  { pattern: '/more', tab: 'more', render: ({ profile }) => <MorePage babyMode={profile.ending?.kind === 'born'} /> },
  { pattern: '/more/partner', tab: 'more', render: ({ profile, today }) => <PartnerPage profile={profile} today={today} /> },
  { pattern: '/more/print', tab: 'more', render: ({ profile, today }) => <PrintPage profile={profile} today={today} /> },
  { pattern: '/more/data', tab: 'more', render: () => <DataPage /> },
  { pattern: '/more/warning-signs', tab: 'more', render: () => <WarningSignsPage /> },
  { pattern: '/more/sync', tab: 'more', render: () => <SyncPage /> },
  { pattern: '/more/sources', tab: 'more', render: () => <SourcesPage /> },
  { pattern: '/more/about', tab: 'more', render: () => <AboutPage /> },
  { pattern: '/more/feedback', tab: 'more', render: ({ profile }) => <FeedbackPage profile={profile} /> },
  { pattern: '/settings', tab: 'more', render: ({ today }) => <SettingsPage today={today} /> },
  { pattern: '/settings/baby-arrived', tab: 'home', render: ({ today }) => <SettingsPage today={today} startBorn /> },
];

export function resolveRoute(path: string): { route: RouteDef; params: RouteParams } | null {
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}
