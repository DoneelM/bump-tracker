/**
 * All guidance copy that gives health advice, in one place for review. General guidance attributed to
 * Health NZ / NHS, never diagnostic. `sources` are ids in `./sources`; keep `docs/SOURCES.md` in sync.
 */

export interface Guidance {
  title: string;
  intro?: string;
  bullets?: readonly string[];
  body?: string;
  closing?: string;
  sources: readonly string[];
}

export const CONTACT_MIDWIFE: Guidance = {
  title: 'When to contact your midwife/LMC',
  intro: 'Health NZ advises calling your midwife/LMC or doctor if:',
  bullets: [
    'you have signs of labour before 37 weeks (contact them as soon as possible)',
    'your waters break or leak (straight away if this happens before labour starts, or if the fluid is green, brown or dirty-looking)',
    'you have any vaginal bleeding',
    'your baby’s movements slow down or change (call straight away, don’t wait until the next day)',
    'your contractions are becoming regular and stronger. Health NZ suggests calling when they come about every 5 minutes, last longer than 50 seconds and have been getting stronger for 2 to 3 hours',
    'you have severe or constant tummy pain',
  ],
  closing: 'If you’re worried, call. You don’t need to wait for a pattern. In an emergency, call 111.',
  sources: ['healthnz-labour', 'healthnz-common-issues', 'healthnz-movements'],
};

export const PRETERM: Guidance = {
  title: 'You’re under 37 weeks',
  body: 'Health NZ advises that if you have signs of labour before 37 weeks, such as regular tightenings or contractions, period-like or lower back pain, a ‘show’, or fluid leaking, you should contact your midwife/LMC or birthing centre or hospital as soon as possible. Don’t wait to see whether a pattern develops. Treatment may be able to delay labour. In an emergency, call 111.',
  sources: ['healthnz-labour', 'healthnz-premature-birth'],
};

export const PATTERN_511: Guidance = {
  title: 'Your timings match the 5-1-1 rule of thumb',
  body: 'That’s contractions about every 5 minutes, lasting about 1 minute, for an hour. Health NZ suggests calling your midwife/LMC when contractions come every 5 minutes, last longer than 50 seconds and have been getting stronger for 2 to 3 hours. This is a good time to call your midwife/LMC or birthing centre or hospital for advice, and call straight away if you’re worried. In an emergency, call 111.',
  sources: ['healthnz-labour', 'nhs-labour-signs'],
};

export const PAST_DUE: Guidance = {
  title: 'Past your due date',
  body: 'Only about 1 in 20 babies arrive on their due date. Most labours start between 1 week before and 2 weeks after it. Keep in touch with your midwife/LMC. If your pregnancy has been straightforward, induction is usually offered between 41 and 42 weeks in New Zealand, and they’ll talk with you about your options. Keep noticing your baby’s movements, and call your midwife/LMC straight away if they slow down or change.',
  sources: ['healthnz-labour', 'healthnz-movements', 'nz-iol-guideline'],
};

/** Shown in addition from 42w1d (more than 14 days past the due date). */
export const PAST_DUE_OVERDUE_LINE =
  'Health NZ describes a pregnancy as overdue when you are still pregnant more than 2 weeks after your due date. If you haven’t already, talk with your midwife/LMC today.';

export const PRE_ECLAMPSIA: Guidance = {
  title: 'Contact your midwife/LMC straight away',
  body: 'Some swelling is common in pregnancy. But a severe headache that doesn’t go away, sudden swelling of your face, hands or feet, vision changes like blurring or flashing lights, pain just below your ribs, vomiting or difficulty breathing can be signs of pre-eclampsia. Health NZ advises getting medical advice immediately, so contact your midwife/LMC straight away rather than waiting for your next appointment. In an emergency, call 111.',
  sources: ['healthnz-pre-eclampsia', 'healthnz-common-issues', 'nhs-pre-eclampsia'],
};

export const WORRIED_ABOUT_MOVEMENTS: Guidance = {
  title: 'Contact your midwife/LMC or birthing centre or hospital now if you’re worried',
  body: 'Health NZ advises calling your midwife or doctor immediately if your baby moves less and less, doesn’t move all day, or you’re worried they aren’t moving enough. Never wait until the next day. There’s no set number of movements to count. What matters is your baby’s usual pattern, so call straight away if it changes. In an emergency, call 111.',
  sources: ['healthnz-movements', 'nhs-movements'],
};
