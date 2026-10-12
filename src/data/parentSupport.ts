/**
 * Support for the parent after birth, and safe sleep. Word for word from the sources (checked
 * 12/10/2026); don't change from memory. Keep `docs/SOURCES.md` in sync.
 * - After the birth: Health NZ, "Normal changes to your body after birth" and "Problems in the week
 *   after the birth" (CC BY 4.0, last updated 22 July 2026). The "talk to your midwife" lines from each
 *   section, word for word, grouped under our own headings. Healthify's longer list is linked, not copied.
 * - Not alone line: PADA, "Get help now".
 * - Safe sleep: Starship Safekids, "Safe sleep: birth to 11 months".
 */

export const RECOVERY_SOURCE_IDS = ['healthnz-after-birth', 'healthnz-week-after-birth'] as const;
export const RECOVERY_MORE_SOURCE_ID = 'healthify-birth-injuries';
export const PADA_SOURCE_ID = 'pada-get-help';
export const SAFE_SLEEP_SOURCE_ID = 'starship-safe-sleep';

/** Urgent: shown first. */
export const RECOVERY_URGENT =
  'Get help straight away from your midwife or a doctor if the swelling is only in one leg or ankle, and your calf is quite tender or sore. This could be a sign of a blood clot.';

export const RECOVERY_GROUPS: readonly { title: string; lead: string; items: readonly string[] }[] = [
  {
    title: 'Bleeding',
    lead: 'Talk to your midwife or doctor if:',
    items: ['you are losing blood in large clots', 'bleeding changes to a bright red colour', 'the bleeding is smelly.'],
  },
  {
    title: 'Swollen legs',
    lead: 'Talk to your midwife if:',
    items: ['the swelling does not go away after a week', 'you have headaches or pain in your legs.'],
  },
  {
    title: 'Your breasts',
    lead: 'Talk to your midwife or doctor if:',
    items: ['you are very uncomfortable', 'you need advice about your breasts if you are not breastfeeding.'],
  },
];

export const RECOVERY_NOTES: readonly string[] = [
  'Let your midwife know if your stitches are sore.',
  'If the stinging lasts for more than a few days, tell your midwife or doctor.',
];

export const NOT_ALONE =
  '1 in 5 women and 1 in 10 men feel the way you do, you are not alone.';

export const TALK_TO = ['Your GP or local medical centre', 'Your midwife', 'Your Whānau Āwhina Plunket or Well Child nurse', 'A person you trust'];

export const SAFE_SLEEP_ABC = [
  { letter: 'A', text: 'alone' },
  { letter: 'B', text: 'on their backs' },
  { letter: 'C', text: 'in a cot every time' },
] as const;

export const SAFE_SLEEP_TIPS: readonly string[] = [
  'Always place your baby on their back to sleep, not on their stomach or side and use a firm mattress.',
  'Toys, pillows, blankets, unfitted sheets, comforters, sheepskins and bumper pads are suffocation risks so keep them out of your baby’s bed.',
  'Smoking has been shown to increase the risk of SUDI so keep your baby away from second-hand smoke.',
];
