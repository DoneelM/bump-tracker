/**
 * What Health NZ says about folic acid and iodine in pregnancy (source id `healthnz-supplements`,
 * "Nutrients and supplements in pregnancy", checked 11/10/2026). Don't change the figures from memory.
 * Keep `docs/SOURCES.md` in sync.
 */

export const SUPPLEMENT_SOURCE_ID = 'healthnz-supplements';

export const SUPPLEMENT_INFO: Record<'folic-acid' | 'iodine', string> = {
  'folic-acid':
    'Take a folic acid tablet (0.8 milligrams) every day from 4 weeks before you might become pregnant until 12 weeks after. If you haven’t been taking it, start as soon as possible. With more than 1 pēpi you may need to keep taking it for the whole pregnancy.',
  iodine: 'Take one iodine tablet (150 micrograms) every day while you’re pregnant and breastfeeding.',
};

export const SUPPLEMENT_FREE_LINE =
  'You can buy both at a pharmacy, but they’re free when prescribed by your midwife, doctor or nurse practitioner. Talk to them first.';
