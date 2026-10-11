/**
 * Support for the parent after birth, and safe sleep. Word for word from the sources (checked
 * 12/10/2026); don't change from memory. Keep `docs/SOURCES.md` in sync.
 * - Warning signs: Healthify, "Maternal birth injuries" ("When should I seek medical help?"),
 *   reviewed 12 Feb 2024 by ACC's Maternal Birth Injury Team.
 * - Not alone line: PADA, "Get help now".
 * - Safe sleep: Starship Safekids, "Safe sleep: birth to 11 months".
 */

export const RECOVERY_SOURCE_ID = 'healthify-birth-injuries';
export const PADA_SOURCE_ID = 'pada-get-help';
export const SAFE_SLEEP_SOURCE_ID = 'starship-safe-sleep';

export const RECOVERY_INTRO =
  'It will take your body a while to recover from the pregnancy and birth process but if you have ongoing pain, swelling or bleeding it might mean something is wrong. Listen to your body and if something doesn’t feel right, talk to your healthcare provider.';

export const RECOVERY_SIGNS: readonly string[] = [
  'heavy vaginal bleeding that continues to increase and soaks a maternity pad in less than 30 minutes, or passing large blood clots (lumps of blood)',
  'chills of less than 36°C or a fever of more than 38°C',
  'fainting or dizziness',
  'changes to your vision or a severe, persistent headache',
  'painful urination or difficulty urinating (passing urine/pee/mimi)',
  'vaginal discharge with a strong odour',
  'heart palpitations (irregular heartbeats), chest pain or difficulty breathing',
  'vomiting (being sick)',
  'the wound from your C-section or episiotomy being red, swollen, or has pus',
  'abdominal (lower belly) pain that’s getting worse, or new abdominal pain',
  'sore breasts that are red or feel hot to the touch',
  'pain in your legs with redness or swelling',
  'increased swelling in your legs, feet or hands',
  'incontinence that lasts more than 6 weeks',
  'passing gas, faeces (poo), urine, or pus from your vagina',
  'prolonged sadness, significant anxiety, or other significant changes in mood or energy, that make it hard for you to complete daily tasks',
  'pain during and after sex',
  'a dragging sensation or feeling of heaviness in your pelvic region',
  'pain when walking and sitting that continues several weeks after the birth',
];

export const RECOVERY_ACTION = 'If you experience any of these, contact your healthcare provider for advice and support.';

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
