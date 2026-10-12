/**
 * Emergency help for a baby, word for word from the sources (checked 12/10/2026). Safety-critical: never
 * reword or change these from memory. Keep `docs/SOURCES.md` in sync.
 *
 * - Choking: Health NZ, "Choking" (baby steps only).
 * - Not breathing: KidsHealth, "CPR for babies under 12 months" (last reviewed 7 October 2026), all
 *   seven steps unchanged, as KidsHealth's terms require. Health NZ's CPR page sends readers there for babies.
 * - When to get help: KidsHealth, "Is my child sick?".
 */

export const CHOKING_SOURCE_ID = 'healthnz-choking';
export const CPR_SOURCE_ID = 'kidshealth-baby-cpr';
export const SICK_SOURCE_ID = 'kidshealth-is-my-child-sick';
export const CPR_VIDEO_URL = 'https://www.youtube.com/watch?v=gtbUB1XPW_o';
export const FIRST_AID_COURSES_URL = 'https://www.stjohn.org.nz/first-aid/';

export const CHOKING = {
  callFirst: 'Phone 111 immediately if the person who is choking cannot breathe, talk or cough, or if they become unconscious.',
  never: 'Never use back blows on someone who can cough or breathe.',
  backBlows: [
    'Call 111 for an ambulance.',
    'If a baby is choking, place them face down on your lap. Make sure their head is supported.',
    'Give them up to 5 back blows between their shoulder blades using the heel of your hand.',
    'Check between each blow to see if you have dislodged the object.',
  ],
  chestThrusts: [
    'Lay the baby face up on your forearm or your lap.',
    'Support their head and jaw with your hand.',
    'Place your middle and index fingers at the centre of their chest bone (just below the nipple line).',
    'Give 5 separate, quick, sharp, inward and upwards thrusts.',
  ],
  then: 'Swap between back blows and chest thrusts until the object has come out or an ambulance has arrived. If the person stops breathing, start CPR.',
} as const;

export const CPR_LEARN = 'Learn CPR before you need it.';

/** KidsHealth's DRSABCD steps, in order. */
export const CPR_STEPS: readonly { title: string; lines: readonly string[] }[] = [
  { title: 'Dangers', lines: ['Check for any danger to you, the baby, or people nearby. Do what you can to reduce the danger.'] },
  { title: 'Response', lines: ['Check the baby for a response. Talk loudly and gently squeeze the baby\'s shoulder. See if the baby moves or cries.'] },
  { title: 'Send for help', lines: ['Call 111 (in New Zealand) and ask for urgent medical help.'] },
  {
    title: 'Airway',
    lines: [
      'Tilt the baby\'s head back and lift their chin. This will help open their airway.',
      'If you can see anything obvious in the mouth, like food, use a finger to sweep it out.',
    ],
  },
  {
    title: 'Breathing',
    lines: [
      'Check for breathing. Listen and feel for air coming out of their mouth or nose.',
      'If you are worried the baby is not breathing - start CPR.',
    ],
  },
  {
    title: 'CPR',
    lines: [
      'Put the baby on their back, on a firm surface.',
      'Place 2 fingers of one hand in the centre of the chest just below the nipples. Start chest compressions at a rate of 100 per minute.',
      'Once you have completed 30 compressions, seal your lips around the baby\'s mouth and nose and give 2 breaths.',
      'Keep giving 30 compressions followed by 2 breaths until help arrives.',
    ],
  },
  {
    title: 'Defibrillator',
    lines: [
      'If there is an AED nearby, attach it to the baby as soon as possible. Turn it on and follow the instructions on the AED. The defibrillator will talk to you.',
      'Place one pad on the chest and the other pad on the back of the baby.',
      'Return to CPR (step 6) and keep going until the baby starts breathing normally, or help arrives.',
    ],
  },
];

/** KidsHealth's three levels, most urgent first. */
export const WHEN_TO_GET_HELP: readonly { title: string; items: readonly string[] }[] = [
  {
    title: 'Call 111 if your baby',
    items: ['is floppy', 'is blue around the mouth', 'is struggling to breathe', 'is unresponsive', 'you’re worried'],
  },
  {
    title: 'See a health professional urgently if your baby',
    items: [
      'is under 3 months old',
      'looks unwell',
      'is hard to wake',
      'is not weeing',
      'is not interested in surroundings',
      'is having trouble breathing',
      'is in severe pain',
      'has a severe headache',
      'is upset by bright lights',
      'is not drinking',
      'is vomiting and not keeping fluids down',
      'has a rash',
      'you’re worried',
    ],
  },
  {
    title: 'Call Healthline or see a health professional if your baby',
    items: [
      'is under 3 months old',
      'is drinking less than half of their normal feeds',
      'has less than half of their normal wet nappies or their wee is dark',
      'has a sore throat or joint pain',
      'has frequent watery poo (diarrhoea)',
      'is vomiting and not keeping fluids down',
      'is in pain',
      'is unwell with a fever',
      'is getting sicker',
      'you’re worried',
    ],
  },
];

export const UNDER_3_MONTHS = 'If your child is under 3 months old and they have a fever, always take them to a health professional.';
