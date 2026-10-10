import { makeDefaults } from '../lib/checklists';

export const BAG_SPEC = {
  'For you': ['Comfortable clothes / nightwear', 'Dressing gown and slippers', 'Toiletries', 'Maternity pads', 'Nursing bras / feeding tops', 'Underwear', 'Snacks and drinks', 'Phone charger'],
  'For baby': ['Going-home outfit', 'Singlets / bodysuits', 'Wraps / blankets', 'Hat', 'Newborn nappies', 'Car seat (fitted)'],
  'For your support person': ['Change of clothes', 'Snacks and drinks', 'Phone charger', 'Cash / coins for parking'],
  Documents: ['Maternity notes', 'Birth plan', 'NHI number / ID', 'Contact numbers (midwife/LMC, whānau)'],
} as const;

export const PLAN_SPEC = {
  'Birth place & people': ['Where I’d like to give birth', 'Who I’d like with me', 'Interpreter or cultural / spiritual needs'],
  Environment: ['Lighting', 'Music', 'Movement and positions', 'Water (bath or pool)'],
  'Pain relief preferences (to discuss with your midwife)': ['Breathing and relaxation', 'Massage / TENS', 'Gas (Entonox)', 'Other options to ask about'],
  'After the birth': ['Skin-to-skin contact', 'Cord clamping preference', 'Feeding plan', 'Vitamin K and newborn checks', 'Who cuts the cord'],
  Notes: ['Anything else I’d like my midwife to know'],
} as const;

export const BAG_SECTIONS = Object.keys(BAG_SPEC);
export const PLAN_SECTIONS = Object.keys(PLAN_SPEC);
export const bagDefaults = () => makeDefaults('bag', BAG_SPEC);
export const planDefaults = () => makeDefaults('plan', PLAN_SPEC);
