/**
 * Emergency help for a baby, word for word from the sources (checked 12/10/2026). Safety-critical: never
 * reword or change these from memory. Keep `docs/SOURCES.md` in sync.
 *
 * - Choking: Health NZ, "Choking" (baby steps only).
 * - Not breathing: Hato Hone St John, "Baby CPR" ("Quick help" and "How to do CPR on babies"). Their
 *   DRSABCD airway step mentions sweeping the mouth, which Health NZ's choking page warns against unless
 *   the object can be seen and grabbed; that step is left out pending clinical review.
 * - When to get help: KidsHealth, "Is my child sick?".
 */

export const CHOKING_SOURCE_ID = 'healthnz-choking';
export const CPR_SOURCE_ID = 'stjohn-baby-cpr';
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

export const CPR = {
  intro: 'If a baby (a child one year old or younger) becomes unresponsive and isn’t breathing normally:',
  quick: [
    'Call 111 and ask for an ambulance.',
    'Using two fingers, push on the baby’s chest hard and fast 30 times.',
    'Breathe into their mouth 2 times.',
    'Keep going until an ambulance arrives.',
  ],
  quickNote:
    'Chest compressions (pushing on the baby’s chest) are the most important part of CPR. If you can’t give breath to the baby, continue with chest compressions, pushing hard and fast.',
  pushes: [
    'Place the baby on a flat surface, or support them on your lap or arm.',
    'Place two fingers of one hand in the centre of their chest, just below an imaginary line between the nipples.',
    'Push down hard and fast 30 times. Push down one-third of chest depth.',
    'Don’t worry about pushing too hard – you need to push hard and fast.',
  ],
  breaths: [
    'Keep the baby’s head in a neutral position with one hand.',
    'Seal your lips around the baby’s mouth and nose.',
    'Gently puff into the baby until you see the chest rise.',
    'Remove your mouth, take a fresh breath, and puff into the baby again.',
  ],
  then: 'Continue with the cycle of 30 pushes and 2 breaths until the ambulance arrives. DO NOT GIVE UP.',
  alone:
    'If you are on your own, and a phone is not readily available, do CPR for about a minute and then call 111 for help. Then, go back to doing CPR as quickly as you can.',
} as const;

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
