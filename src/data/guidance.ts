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
  intro: 'Health NZ advises contacting your midwife/LMC, doctor or maternity unit if:',
  bullets: [
    'you have signs of labour before 37 weeks (contact them as soon as possible)',
    'your waters break or you leak fluid from your vagina (straight away if it is green, brown or dirty-looking)',
    'you have any vaginal bleeding',
    'your baby’s movements slow down or change',
    'your contractions are becoming regular and stronger. Health NZ suggests calling when they come about every 5 minutes, last longer than 50 seconds and have been getting stronger for 2 to 3 hours',
    'you have severe or constant tummy pain',
  ],
  closing: 'If you’re worried, call. You don’t need to wait for a pattern. In an emergency, call 111.',
  sources: ['healthnz-labour'],
};

export const PRETERM: Guidance = {
  title: 'You’re under 37 weeks',
  body: 'Health NZ advises that if you have signs of labour before 37 weeks, such as regular tightenings or contractions, period-like or lower back pain, a ‘show’, or fluid leaking, you should contact your midwife/LMC or maternity unit as soon as possible. Don’t wait to see whether a pattern develops. Treatment may be able to delay labour. In an emergency, call 111.',
  sources: ['healthnz-labour', 'healthnz-premature-birth'],
};

export const PATTERN_511: Guidance = {
  title: 'Your timings match the 5-1-1 rule of thumb',
  body: 'That’s contractions about every 5 minutes, lasting about 1 minute, for an hour. Health NZ suggests calling your midwife/LMC when contractions come every 5 minutes, last longer than 50 seconds and have been getting stronger for 2 to 3 hours. Contact your midwife/LMC or maternity unit now. In an emergency, call 111.',
  sources: ['healthnz-labour'],
};

export const PAST_DUE: Guidance = {
  title: 'Past your due date',
  body: 'Only about 1 in 20 babies arrive on their due date, and most arrive within 2 weeks after it. Keep in touch with your midwife/LMC. They’ll talk with you about checks and your options as you go past your due date. Keep noticing your baby’s movements, and call your midwife/LMC straight away if they slow down or change.',
  sources: ['healthnz-labour', 'healthnz-movements'],
};

/** Shown in addition from 42w0d (14+ days past the due date). */
export const PAST_DUE_OVERDUE_LINE =
  'Health NZ describes a pregnancy as overdue from 2 weeks past the due date. If you haven’t already, talk with your midwife/LMC today.';

export const PRE_ECLAMPSIA: Guidance = {
  title: 'Check in with your midwife/LMC',
  body: 'Headaches and some swelling are common in pregnancy. But a severe headache that doesn’t go away, sudden swelling of your face, hands or feet, or vision changes like blurring or flashing lights can be signs of pre-eclampsia. Health NZ and the NHS advise getting medical advice straight away, so contact your midwife/LMC promptly rather than waiting for your next appointment. In an emergency, call 111.',
  sources: ['healthnz-pre-eclampsia', 'healthnz-common-issues', 'nhs-pre-eclampsia'],
};

export const WORRIED_ABOUT_MOVEMENTS: Guidance = {
  title: 'Contact your midwife/LMC or maternity unit now if you’re worried',
  body: 'Health NZ advises calling your midwife or doctor immediately if your baby moves less and less, doesn’t move all day, or you’re worried they aren’t moving enough. Never wait until the next day. Don’t rely on counting to 10. You know your baby’s usual pattern best. In an emergency, call 111.',
  sources: ['healthnz-movements', 'nhs-movements'],
};
