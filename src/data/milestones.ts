/**
 * The usual antenatal milestones in Aotearoa New Zealand, from Health NZ (`sources` are ids in `./sources`;
 * keep `docs/SOURCES.md` in sync). `when` is the source's own timing, shown as written. `startDay`/`endDay`
 * are gestational days used only to place a milestone on the timeline; `endDay: null` means "early, as soon
 * as you can". `calendarDay` is where the calendar file puts it (null: not added, e.g. "any stage").
 */

export interface Milestone {
  id: string;
  title: string;
  when: string;
  note: string;
  optional: boolean;
  startDay: number;
  endDay: number | null;
  calendarDay: number | null;
  /** No end given by the source: open until the birth, so no date range is shown. */
  untilBirth?: boolean;
  sources: readonly string[];
}

const w = (weeks: number, days = 0) => weeks * 7 + days;

export const MILESTONES: readonly Milestone[] = [
  {
    id: 'lmc',
    title: 'Find a lead maternity carer (LMC)',
    when: 'As soon as you know you’re pregnant',
    note: 'Your LMC is the midwife or doctor who cares for you through pregnancy and birth, and for you and your pēpi until 6 weeks after. Midwifery care is free if you’re eligible.',
    optional: false,
    startDay: 0,
    endDay: null,
    calendarDay: null,
    sources: ['healthnz-finding-out', 'healthnz-lmc'],
  },
  {
    id: 'bloods',
    title: 'First antenatal blood tests',
    when: 'As soon as possible after you know you’re pregnant',
    note: 'Checks your blood group, immunity and some infections. An HbA1c test for diabetes is offered at the same time. Having the tests is your choice.',
    optional: false,
    startDay: 0,
    endDay: null,
    calendarDay: null,
    sources: ['healthnz-blood-tests', 'healthnz-diabetes-testing'],
  },
  {
    id: 'screening-early',
    title: 'Screening for Down syndrome and other conditions',
    when: 'Blood test best at 9 to 10 weeks (up to 13 weeks 6 days); scan best from 12 weeks to 13 weeks 6 days',
    note: 'Optional. Before 14 weeks you need both the blood test and the nuchal translucency scan to get a result. The blood test is free; you may have to pay for the scan.',
    optional: true,
    startDay: w(9),
    endDay: w(13, 6),
    calendarDay: w(9),
    sources: ['healthnz-screening', 'healthnz-baby-health-checks'],
  },
  {
    id: 'screening-late',
    title: 'Screening, if you didn’t have it before 14 weeks',
    when: 'Blood test best at 14 to 18 weeks, possible up to 20 weeks',
    note: 'Optional. From 14 weeks, screening is a blood test only.',
    optional: true,
    startDay: w(14),
    endDay: w(20),
    calendarDay: null,
    sources: ['healthnz-screening'],
  },
  {
    id: 'whooping-cough',
    title: 'Whooping cough vaccine',
    when: 'Free from 13 weeks, most effective from 16 weeks',
    note: 'Protects your pēpi until their own first immunisations at 6 weeks old. Free in every pregnancy.',
    optional: false,
    startDay: w(13),
    endDay: w(40),
    calendarDay: w(16),
    untilBirth: true,
    sources: ['healthnz-immunisations'],
  },
  {
    id: 'flu',
    title: 'Flu vaccine',
    when: 'Free at any stage of pregnancy',
    note: 'Flu in pregnancy raises the chance of complications for you and your pēpi.',
    optional: false,
    startDay: 0,
    endDay: w(40),
    calendarDay: null,
    untilBirth: true,
    sources: ['healthnz-immunisations'],
  },
  {
    id: 'anatomy-scan',
    title: 'Fetal anatomy scan',
    when: 'Between 18 and 20 weeks',
    note: 'Checks your baby’s size, growth and development, including the head, heart, spine, limbs and tummy. It takes about 30 minutes.',
    optional: false,
    startDay: w(18),
    endDay: w(20),
    calendarDay: w(18),
    sources: ['healthnz-baby-health-checks'],
  },
  {
    id: 'glucose',
    title: 'Glucose test for diabetes in pregnancy',
    when: 'Between 24 and 28 weeks',
    note: 'If you’re not at high risk of diabetes in pregnancy, you’ll be offered an oral glucose challenge test: a sugary drink, then a blood test an hour later. No fasting needed.',
    optional: false,
    startDay: w(24),
    endDay: w(28),
    calendarDay: w(24),
    sources: ['healthnz-diabetes-testing'],
  },
];
