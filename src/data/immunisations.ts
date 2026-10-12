/**
 * Health NZ National Immunisation Schedule for babies and toddlers (source id `healthnz-immunisation`,
 * checked 12/10/2026). Vaccine names and dose numbers are copied from the source; don't change them from
 * memory. The schedule changes from time to time, so the app always points to Health NZ's own tool too.
 */

export const IMMUNISATION_SOURCE_ID = 'healthnz-immunisation';
export const PERSONALISED_SCHEDULE_URL =
  'https://www.healthnz.govt.nz/health-topics/immunisations/when-to-immunise/immunisation-schedule';

export interface ImmunisationVisit {
  id: string;
  label: string;
  /** Due this long after birth. */
  after: { weeks: number } | { months: number };
  vaccines: readonly string[];
}

export const VISITS: readonly ImmunisationVisit[] = [
  {
    id: '6w',
    label: '6 weeks',
    after: { weeks: 6 },
    vaccines: [
      'Rotavirus, oral drops (dose 1 of 2)',
      'Diphtheria, tetanus, whooping cough, polio, hep B and Hib (dose 1 of 3)',
      'Pneumococcal (dose 1 of 3)',
    ],
  },
  {
    id: '3m',
    label: '3 months',
    after: { months: 3 },
    vaccines: [
      'Rotavirus, oral drops (dose 2 of 2)',
      'Diphtheria, tetanus, whooping cough, polio, hep B and Hib (dose 2 of 3)',
      'Meningococcal B (dose 1 of 3)',
    ],
  },
  {
    id: '5m',
    label: '5 months',
    after: { months: 5 },
    vaccines: [
      'Diphtheria, tetanus, whooping cough, polio, hep B and Hib (dose 3 of 3)',
      'Pneumococcal (dose 2 of 3)',
      'Meningococcal B (dose 2 of 3)',
    ],
  },
  {
    id: '12m',
    label: '12 months',
    after: { months: 12 },
    vaccines: ['Measles, mumps and rubella (dose 1 of 2)', 'Pneumococcal (dose 3 of 3)', 'Meningococcal B (dose 3 of 3)'],
  },
  {
    id: '15m',
    label: '15 months',
    after: { months: 15 },
    vaccines: ['Hib (booster dose)', 'Measles, mumps and rubella (dose 2 of 2)', 'Chickenpox (single dose)'],
  },
  {
    id: '4y',
    label: '4 years',
    after: { months: 48 },
    vaccines: ['Diphtheria, tetanus, whooping cough and polio (booster dose)'],
  },
];

export const FREE_LINE =
  'All immunisations on the National Immunisation Schedule are free for children under 18, whatever their visa or citizenship status.';
export const FLU_LINE = 'When your pēpi turns 6 months old, it is recommended they get flu immunisation every year.';
export const PREMATURE_LINE =
  'Premature and low birthweight babies should receive their immunisations starting at 6 weeks old, regardless of how premature they were.';
export const MISSED_LINE = 'If an immunisation has been missed, you can catch up. Catch-up immunisations are free for all tamariki under 18.';
