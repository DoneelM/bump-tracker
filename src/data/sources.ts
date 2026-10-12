/**
 * References for health content shown in the app. Keep `docs/SOURCES.md` in sync.
 * Illustrations are AI-generated stylised art, not medical images.
 */

/**
 * How we may use a source's content (checked 13/10/2026; see docs/SOURCES.md):
 * - `cc-by-4.0`: reuse allowed, with credit and the licence. Say if we changed it.
 * - `ogl-3.0`: UK Open Government Licence (NHS), paraphrased only.
 * - `kidshealth`, `safekids`: free to reproduce unchanged, with credit, but not sold. Ask before charging.
 * - `reference`: facts, numbers or links only. No text is reproduced.
 * - `unconfirmed`: terms not checked yet. Check before charging.
 */
export type Licence = 'cc-by-4.0' | 'ogl-3.0' | 'kidshealth' | 'safekids' | 'reference' | 'unconfirmed';
export const LICENCES: readonly Licence[] = ['cc-by-4.0', 'ogl-3.0', 'kidshealth', 'safekids', 'reference', 'unconfirmed'];
export const LICENCE_LABEL: Record<Licence, string> = {
  'cc-by-4.0': 'CC BY 4.0',
  'ogl-3.0': 'Open Government Licence v3.0',
  kidshealth: 'Reproduced unchanged under KidsHealth’s terms',
  safekids: 'Reproduced unchanged under Safekids Aotearoa’s terms',
  reference: 'Facts and links only',
  unconfirmed: 'Terms not yet confirmed',
};
export const CC_BY_URL = 'https://creativecommons.org/licenses/by/4.0/';

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  licence: Licence;
  /** The text was reordered or trimmed (CC BY asks us to say so). */
  changed?: boolean;
  /** Exact credit wording the publisher asks for, used in place of the default. */
  credit?: string;
  /** What in the app this source is used for. */
  usedFor: string;
}

/** The credit line to show next to reproduced text, or null when none is needed. */
export function creditLine(s: Pick<Source, 'licence' | 'changed' | 'credit'>): string | null {
  if (s.credit) return s.credit;
  switch (s.licence) {
    case 'cc-by-4.0':
      return s.changed ? 'Adapted, under CC BY 4.0.' : 'Licensed under CC BY 4.0.';
    case 'ogl-3.0':
      return 'Contains public sector information licensed under the Open Government Licence v3.0.';
    case 'kidshealth':
      return '© KidsHealth. Reproduced without changes.';
    case 'safekids':
      return 'Reproduced without changes, courtesy of Safekids Aotearoa.';
    default:
      return null;
  }
}

export const SOURCES: readonly Source[] = [
  {
    id: 'nhs-week-by-week',
    title: 'Week-by-week guide to pregnancy',
    publisher: 'NHS',
    licence: 'ogl-3.0',
    url: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/',
    usedFor: 'What’s developing and what you might notice each week (paraphrased), the size-comparison objects, and baby length for weeks 4-5.',
  },
  {
    id: 'perinatology-fetal-development',
    title: 'Fetal development',
    publisher: 'Perinatology.com',
    licence: 'reference',
    url: 'https://www.perinatology.com/Reference/Fetal%20development.htm',
    usedFor: 'Typical baby length for weeks 6-40 in the week guide (crown-rump to week 13, crown-heel from week 14).',
  },
  {
    id: 'who-fetal-growth',
    title: 'WHO Fetal Growth Charts - Kiserud et al. 2017, PLOS Medicine 14(1): e1002220',
    publisher: 'PLOS Medicine / WHO',
    licence: 'cc-by-4.0',
    url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002220',
    usedFor: 'Typical baby weight (estimated fetal weight, 50th percentile) for weeks 14-40 in the week guide, and the typical range on the scans chart.',
  },
  {
    id: 'mayo-pregnancy-week-by-week',
    title: 'Fetal development: The first trimester',
    publisher: 'Mayo Clinic',
    licence: 'reference',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/prenatal-care/art-20045302',
    usedFor: 'Background reference for first-trimester development.',
  },
  {
    id: 'mayo-fetal-development-1',
    title: 'Fetal development: The 2nd trimester',
    publisher: 'Mayo Clinic',
    licence: 'reference',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20046151',
    usedFor: 'Background reference for second-trimester development.',
  },
  {
    id: 'mayo-fetal-development-2',
    title: 'Fetal development: The 3rd trimester',
    publisher: 'Mayo Clinic',
    licence: 'reference',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20045997',
    usedFor: 'Background reference for third-trimester development.',
  },
  {
    id: 'acog-fetus-grows',
    title: 'How your fetus grows during pregnancy',
    publisher: 'ACOG',
    licence: 'reference',
    url: 'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy',
    usedFor: 'Background reference for general fetal growth information.',
  },
  {
    id: 'acog-due-date',
    title: 'Methods for estimating the due date',
    publisher: 'ACOG',
    licence: 'reference',
    url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date',
    usedFor: 'Due date and gestational age calculations.',
  },
  {
    id: 'healthnz-pregnancy',
    title: 'Pregnancy and maternity',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity',
    usedFor: 'NZ context: working with your midwife/LMC and general pregnancy information.',
  },
  {
    id: 'healthnz-movements',
    title: 'Pregnancy and your baby’s movements',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://info.health.nz/pregnancy-maternity/having-a-healthy-pregnancy/pregnancy-and-your-babys-movements',
    usedFor: 'Baby movement guidance (kick counter and kick-session guidance), the past-due-date prompt, and when first movements are usually felt (16-22 weeks, week guide).',
  },
  {
    id: 'healthnz-labour',
    title: 'Going into labour',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/going-into-labour',
    usedFor: 'Labour signs and when to call (contraction timer), the "when to contact your midwife/LMC" panel and the past-due-date prompt.',
  },
  {
    id: 'healthnz-premature-birth',
    title: 'Premature birth and care of your pēpi',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/premature-birth',
    usedFor: 'Signs of labour before 37 weeks: contact your midwife/LMC as soon as possible (contraction timer).',
  },
  {
    id: 'healthnz-pre-eclampsia',
    title: 'Preeclampsia',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/pre-eclampsia',
    usedFor: 'Pre-eclampsia warning signs (journal).',
  },
  {
    id: 'healthnz-common-issues',
    title: 'Common issues in pregnancy',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/health-problems-in-pregnancy/common-issues',
    usedFor: 'Danger signs that need prompt advice (journal; waters breaking in the contraction timer panel).',
  },
  {
    id: 'nhs-pre-eclampsia',
    title: 'Pre-eclampsia',
    publisher: 'NHS',
    licence: 'ogl-3.0',
    url: 'https://www.nhs.uk/conditions/pre-eclampsia/',
    usedFor: 'Pre-eclampsia warning signs (journal).',
  },
  {
    id: 'nhs-movements',
    title: 'Your baby’s movements',
    publisher: 'NHS',
    licence: 'ogl-3.0',
    url: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/',
    usedFor: 'Baby movement guidance (kick counter and kick-session guidance), and the note that first movements may come after 20 weeks with a first baby.',
  },
  {
    id: 'nhs-labour-signs',
    title: 'Signs that labour has begun',
    publisher: 'NHS',
    licence: 'ogl-3.0',
    url: 'https://www.nhs.uk/pregnancy/labour-and-birth/signs-of-labour/signs-that-labour-has-begun/',
    usedFor: 'Background for the 5-1-1 prompt on the contraction timer (when to call for advice).',
  },
  {
    id: 'nz-iol-guideline',
    title: 'Induction of Labour in Aotearoa New Zealand (2019, final 2021)',
    publisher: 'Ministry of Health',
    licence: 'reference',
    url: 'https://www.midwife.org.nz/wp-content/uploads/2020/02/induction-of-labour-in-Aotearoa-New-Zealand-guideline-2019.pdf',
    usedFor: 'Induction usually offered between 41 and 42 weeks for a straightforward pregnancy (past-due prompt).',
  },
  {
    id: 'iom-weight-gain',
    title: 'Weight Gain During Pregnancy: Reexamining the Guidelines',
    publisher: 'Institute of Medicine (2009)',
    licence: 'reference',
    url: 'https://www.nationalacademies.org/read/12584/chapter/2',
    usedFor: 'Pregnancy weight gain ranges (weight tracker).',
  },
  {
    id: 'healthnz-healthline',
    title: 'Healthline',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/online-phone-healthcare/healthline',
    usedFor: 'Healthline number (0800 611 116) on the call cards and the Warning signs page.',
  },
  {
    id: 'mpi-food-pregnancy',
    title: 'List of safe food in pregnancy',
    publisher: 'New Zealand Food Safety (MPI)',
    licence: 'cc-by-4.0',
    credit: 'Source: Ministry for Primary Industries and licensed by MPI for re-use under the Creative Commons Attribution 4.0 International licence.',
    url: 'https://www.mpi.govt.nz/food-safety-home/food-pregnancy/list-safe-food-pregnancy',
    usedFor: 'The food safety guide: what is OK to eat, what needs care or cooking, what not to eat, and fish servings for mercury.',
  },
  {
    id: 'healthnz-supplements',
    title: 'Nutrients and supplements in pregnancy',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/nutrients-and-supplements-in-pregnancy',
    usedFor: 'Folic acid and iodine: how much, when, and that they are free on prescription (supplements screen).',
  },
  {
    id: 'healthnz-choking',
    title: 'Choking',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/tests-and-treatments/emergencies-and-first-aid/choking',
    changed: true,
    usedFor: 'What to do if your baby is choking (Help tab), word for word.',
  },
  {
    id: 'kidshealth-baby-cpr',
    title: 'CPR for babies under 12 months',
    publisher: 'KidsHealth',
    licence: 'kidshealth',
    url: 'https://www.kidshealth.org.nz/cpr/emergencies-cpr-for-babies-under-12-months',
    usedFor: 'What to do if your baby is not breathing (Help tab), word for word.',
  },
  {
    id: 'kidshealth-is-my-child-sick',
    title: 'Is my child sick?',
    publisher: 'KidsHealth',
    licence: 'kidshealth',
    url: 'https://www.kidshealth.org.nz/is-my-child-sick',
    usedFor: 'When to call 111, see a health professional urgently, or call Healthline about your baby (Help tab).',
  },
  {
    id: 'healthnz-immunisation',
    title: 'National Immunisation Schedule',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/immunisations/national-immunisation-schedule',
    usedFor: 'Baby immunisation visits, the vaccines at each, and that they are free (immunisations screen).',
  },
  {
    id: 'pada-get-help',
    title: 'Get help now',
    publisher: 'Perinatal Anxiety & Depression Aotearoa (PADA)',
    licence: 'unconfirmed',
    url: 'https://pada.nz/get-help-now/',
    usedFor: 'Support lines for parents (Lifeline, Samaritans, 1737, PlunketLine) and who to talk to (baby mode).',
  },
  {
    id: 'healthnz-after-birth',
    title: 'Normal changes to your body after birth',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    changed: true,
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/you-and-your-newborn/normal-changes-to-your-body-after-birth',
    usedFor: 'When to talk to your midwife or doctor about bleeding, breasts and stinging after the birth (Help tab, baby mode).',
  },
  {
    id: 'healthnz-week-after-birth',
    title: 'Problems in the week after the birth',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    changed: true,
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/you-and-your-newborn/problems-in-the-week-after-the-birth',
    usedFor: 'When to talk to your midwife about stitches and swollen legs, and getting help straight away for a possible blood clot (Help tab, baby mode).',
  },
  {
    id: 'healthify-birth-injuries',
    title: 'Maternal birth injuries: when should I seek medical help?',
    publisher: 'Healthify (reviewed by ACC Maternal Birth Injury Team)',
    licence: 'reference',
    url: 'https://healthify.nz/health-a-z/m/maternal-birth-injuries',
    usedFor: 'Linked from the Help tab for a longer list of signs after the birth. No text reproduced.',
  },
  {
    id: 'starship-safe-sleep',
    title: 'Safe sleep: birth to 11 months',
    publisher: 'Starship Safekids',
    licence: 'safekids',
    url: 'https://www.starship.org.nz/safekids/safe-sleep-birth-to-11-months/',
    usedFor: 'Safe sleep card (A.B.C. and top tips) on Home in baby mode.',
  },
  {
    id: 'plunketline',
    title: 'PlunketLine',
    publisher: 'Whānau Āwhina Plunket',
    licence: 'reference',
    url: 'https://www.plunket.org.nz/plunket-and-you/services-we-offer/plunketline/',
    usedFor: 'PlunketLine number (0800 933 922), shown once your baby is born.',
  },
  {
    id: 'need-to-talk-1737',
    title: '1737, Need to talk?',
    publisher: '1737',
    licence: 'reference',
    url: 'https://1737.org.nz/',
    usedFor: 'Free call or text 1737 for support, 24/7 (shown if a pregnancy has ended).',
  },
  {
    id: 'sands-nz',
    title: 'Sands New Zealand',
    publisher: 'Sands New Zealand',
    licence: 'reference',
    url: 'https://www.sands.org.nz/',
    usedFor: 'Support after the death of a baby at any stage of pregnancy (shown if a pregnancy has ended).',
  },
  {
    id: 'miscarriage-support-nz',
    title: 'Miscarriage Support',
    publisher: 'Miscarriage Support NZ',
    licence: 'reference',
    url: 'https://www.miscarriagesupport.org.nz/',
    usedFor: 'Support and information after miscarriage (shown if a pregnancy has ended).',
  },
  {
    id: 'healthnz-finding-out',
    title: 'Finding out you are pregnant',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/finding-out-you-are-pregnant',
    usedFor: 'Find a lead maternity carer as soon as you know you’re pregnant (timeline).',
  },
  {
    id: 'healthnz-lmc',
    title: 'Lead maternity carers: midwives and doctors',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/lead-maternity-carers',
    usedFor: 'What an LMC does and that they care for you and your pēpi until 6 weeks after the birth (timeline).',
  },
  {
    id: 'healthnz-blood-tests',
    title: 'Blood tests in pregnancy',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/blood-tests-pregnancy',
    usedFor: 'First antenatal blood tests as soon as possible after you know you’re pregnant (timeline).',
  },
  {
    id: 'healthnz-diabetes-testing',
    title: 'Diabetes testing in pregnancy',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/diabetes-testing-pregnancy',
    usedFor: 'HbA1c with the first blood tests, and the oral glucose challenge test at 24 to 28 weeks (timeline).',
  },
  {
    id: 'healthnz-screening',
    title: 'Screening for Down syndrome and other conditions',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/down-syndrome-other-conditions',
    usedFor: 'Screening windows: blood test best at 9 to 10 weeks (to 13w6d) with a scan from 12w0d to 13w6d, or a blood test at 14 to 20 weeks (timeline).',
  },
  {
    id: 'healthnz-baby-health-checks',
    title: 'Checking the growth, development and heart health of your pēpi',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/baby-health-checks',
    usedFor: 'Fetal anatomy scan between 18 and 20 weeks; nuchal translucency scan (timeline).',
  },
  {
    id: 'healthnz-immunisations',
    title: 'Pregnancy and immunisations',
    publisher: 'Health NZ',
    licence: 'cc-by-4.0',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-and-immunisations',
    usedFor: 'Whooping cough vaccine free from 13 weeks and most effective from 16; flu vaccine free at any stage (timeline).',
  },
];
