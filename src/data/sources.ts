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
    usedFor: 'What’s developing and what you might notice each week (paraphrased), and the size-comparison objects.',
  },
  {
    id: 'who-fetal-growth',
    title: 'WHO Fetal Growth Charts - Kiserud et al. 2017, PLOS Medicine 14(1): e1002220',
    publisher: 'PLOS Medicine / WHO',
    url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002220',
    usedFor: 'Typical estimated fetal weight (50th percentile) for weeks 14-40.',
  },
  {
    id: 'mayo-pregnancy-week-by-week',
    title: 'Pregnancy week by week',
    publisher: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/prenatal-care/art-20045302',
    usedFor: 'Cross-checking general trimester and development information.',
  },
  {
    id: 'mayo-fetal-development-1',
    title: 'Fetal development: The first trimester',
    publisher: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20046151',
    usedFor: 'Cross-checking first-trimester development.',
  },
  {
    id: 'mayo-fetal-development-2',
    title: 'Fetal development: The second trimester',
    publisher: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20045997',
    usedFor: 'Cross-checking second-trimester development.',
  },
  {
    id: 'acog-fetus-grows',
    title: 'How your fetus grows during pregnancy',
    publisher: 'ACOG',
    url: 'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy',
    usedFor: 'Cross-checking general fetal growth information.',
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
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/pregnancy-and-your-babys-movements',
    usedFor: 'Baby movement guidance (kick counter).',
  },
  {
    id: 'healthnz-labour',
    title: 'Going into labour',
    publisher: 'Health NZ',
    url: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/going-into-labour',
    usedFor: 'Labour signs and when to call (contraction timer).',
  },
  {
    id: 'nhs-movements',
    title: 'Your baby’s movements',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/',
    usedFor: 'Cross-checking baby movement guidance.',
  },
  {
    id: 'iom-weight-gain',
    title: 'Weight Gain During Pregnancy: Reexamining the Guidelines',
    publisher: 'Institute of Medicine (2009)',
    url: 'https://www.nationalacademies.org/read/12584/chapter/2',
    usedFor: 'Pregnancy weight gain ranges (weight tracker).',
  },
];
