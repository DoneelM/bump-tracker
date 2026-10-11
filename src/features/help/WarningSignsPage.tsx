import { CallCard } from '../../components/CallCard';
import { GuidanceCard } from '../../components/GuidanceCard';
import { Page } from '../../components/Page';
import { CONTACT_MIDWIFE, PRE_ECLAMPSIA, WORRIED_ABOUT_MOVEMENTS } from '../../data/guidance';

/** Everything about "when to call" in one place: the user's numbers, NZ lines, and the sourced warning signs. */
export function WarningSignsPage() {
  return (
    <Page title="When to call" icon="📞" back={{ to: '/more', label: 'More' }}>
      <p>If you’re worried, call. You don’t need to be sure something is wrong. In an emergency, call 111.</p>
      <CallCard title="Call for help" />
      <GuidanceCard g={CONTACT_MIDWIFE} />
      <GuidanceCard g={{ ...WORRIED_ABOUT_MOVEMENTS, title: 'Your baby’s movements' }} />
      <GuidanceCard g={{ ...PRE_ECLAMPSIA, title: 'Signs of pre-eclampsia' }} />
    </Page>
  );
}
