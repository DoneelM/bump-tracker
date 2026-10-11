/**
 * References for health content shown in the app. Keep `docs/SOURCES.md` in sync.
 * Illustrations are AI-generated stylised art, not medical images.
 */

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** What in the app this source is used for. */
  usedFor: string;
}

export const SOURCES: readonly Source[] = [
  {
    id: 'nhs-week-by-week',
    title: 'Week-by-week guide to pregnancy',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/',
    usedFor: 'What’s developing and what you might notice each week (paraphrased), the size-comparison objects, and baby length for weeks 4-5.',
  },
  {
    id: 'perinatology-fetal-development',
    title: 'Fetal development',
    publisher: 'Perinatology.com',
    url: 'https://www.perinatology.com/Reference/Fetal%20development.htm',
    usedFor: 'Typical baby length for weeks 6-40 in the week guide (crown-rump to week 13, crown-heel from week 14).',
  },
  {
    id: 'who-fetal-growth',
    title: 'WHO Fetal Growth Charts - Kiserud et al. 2017, PLOS Medicine 14(1): e1002220',
    publisher: 'PLOS Medicine / WHO',
    url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002220',
    usedFor: 'Typical baby weight (estimated fetal weight, 50th percentile) for weeks 14-40 in the week guide, and the typical range on the scans chart.',
  },
  {
    id: 'mayo-pregnancy-week-by-week',
    title: 'Fetal development: The first trimester',
    publisher: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/prenatal-care/art-20045302',
    usedFor: 'Background reference for first-trimester development.',
  },
  {
    id: 'mayo-fetal-development-1',
    title: 'Fetal development: The 2nd trimester',
    publisher: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20046151',
    usedFor: 'Background reference for second-trimester development.',
  },
  {
    id: 'mayo-fetal-development-2',
    title: 'Fetal development: The 3rd trimester',
    publisher: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20045997',
    usedFor: 'Background reference for third-trimester development.',
  },
  {
    id: 'acog-fetus-grows',
    title: 'How your fetus grows during pregnancy',
    publisher: 'ACOG',
    url: 'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy',
    usedFor: 'Background reference for general fetal growth information.',
  },
  {
    id: 'acog-due-date',
    title: 'Methods for estimating the due date',
    publisher: 'ACOG',
    url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date',
    usedFor: 'Due date and gestational age calculations.',
  },
  {
    id: 'healthnz-pregnancy',
    title: 'Pregnancy and maternity',
    publisher: 'Health NZ',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity',
    usedFor: 'NZ context: working with your midwife/LMC and general pregnancy information.',
  },
  {
    id: 'healthnz-movements',
    title: 'Pregnancy and your baby’s movements',
    publisher: 'Health NZ',
    url: 'https://info.health.nz/pregnancy-maternity/having-a-healthy-pregnancy/pregnancy-and-your-babys-movements',
    usedFor: 'Baby movement guidance (kick counter and kick-session guidance), the past-due-date prompt, and when first movements are usually felt (16-22 weeks, week guide).',
  },
  {
    id: 'healthnz-labour',
    title: 'Going into labour',
    publisher: 'Health NZ',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/going-into-labour',
    usedFor: 'Labour signs and when to call (contraction timer), the "when to contact your midwife/LMC" panel and the past-due-date prompt.',
  },
  {
    id: 'healthnz-premature-birth',
    title: 'Premature birth and care of your pēpi',
    publisher: 'Health NZ',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/premature-birth',
    usedFor: 'Signs of labour before 37 weeks: contact your midwife/LMC as soon as possible (contraction timer).',
  },
  {
    id: 'healthnz-pre-eclampsia',
    title: 'Preeclampsia',
    publisher: 'Health NZ',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/pre-eclampsia',
    usedFor: 'Pre-eclampsia warning signs (journal).',
  },
  {
    id: 'healthnz-common-issues',
    title: 'Common issues in pregnancy',
    publisher: 'Health NZ',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/health-problems-in-pregnancy/common-issues',
    usedFor: 'Danger signs that need prompt advice (journal; waters breaking in the contraction timer panel).',
  },
  {
    id: 'nhs-pre-eclampsia',
    title: 'Pre-eclampsia',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/conditions/pre-eclampsia/',
    usedFor: 'Pre-eclampsia warning signs (journal).',
  },
  {
    id: 'nhs-movements',
    title: 'Your baby’s movements',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/',
    usedFor: 'Baby movement guidance (kick counter and kick-session guidance), and the note that first movements may come after 20 weeks with a first baby.',
  },
  {
    id: 'nhs-labour-signs',
    title: 'Signs that labour has begun',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/pregnancy/labour-and-birth/signs-of-labour/signs-that-labour-has-begun/',
    usedFor: 'Background for the 5-1-1 prompt on the contraction timer (when to call for advice).',
  },
  {
    id: 'nz-iol-guideline',
    title: 'Induction of Labour in Aotearoa New Zealand (2019, final 2021)',
    publisher: 'Ministry of Health',
    url: 'https://www.midwife.org.nz/wp-content/uploads/2020/02/induction-of-labour-in-Aotearoa-New-Zealand-guideline-2019.pdf',
    usedFor: 'Induction usually offered between 41 and 42 weeks for a straightforward pregnancy (past-due prompt).',
  },
  {
    id: 'iom-weight-gain',
    title: 'Weight Gain During Pregnancy: Reexamining the Guidelines',
    publisher: 'Institute of Medicine (2009)',
    url: 'https://www.nationalacademies.org/read/12584/chapter/2',
    usedFor: 'Pregnancy weight gain ranges (weight tracker).',
  },
];
