/**
 * Week-by-week guide content.
 *
 * Lengths and weights come from the research data: weight is the WHO fetal growth chart
 * 50th-percentile estimated fetal weight (weeks 14-40 only; null before that).
 * Bullet text is a plain-English paraphrase of the NHS week-by-week guide with
 * UK-specific details removed. Sources are listed in `src/data/sources.ts`.
 */

/** Crown-rump length is typically quoted in early pregnancy, crown-heel later. */
export type LengthMeasure = 'crown-rump' | 'crown-heel';

export interface WeekInfo {
  /** Completed weeks of pregnancy this entry describes (e.g. 24 = 24w0d-24w6d). */
  week: number;
  /** What's developing with baby this week. */
  developing: string[];
  /** What the mother may notice or experience. */
  mother: string[];
  /** Typical length in centimetres. */
  lengthCm: number;
  /** How `lengthCm` is measured. */
  lengthNote: LengthMeasure;
  /** Typical weight in grams, or null before week 14 (too small to weigh meaningfully). */
  weightG: number | null;
  /** Friendly size comparison with article, e.g. "a lemon". */
  sizeObject: string;
  sizeEmoji: string;
  /** Per-week source page. */
  sourceUrl: string;
}

export const FIRST_GUIDE_WEEK = 4;
export const LAST_GUIDE_WEEK = 40;

export const WEEKS: readonly WeekInfo[] = [
  {
    week: 4,
    developing: [
      'Your baby is a tiny embryo nestling into the lining of your womb.',
      'A fluid-filled sac cushions them, and a yolk sac feeds them for now.',
      'The outer cells are starting to form the placenta.',
    ],
    mother: [
      'You may not have any symptoms yet, and you probably don\'t look pregnant.',
      'A missed period is often the first sign.',
      'Some people notice sore breasts, tiredness, a metallic taste or needing to wee more often.',
      'Light spotting or period-like cramps can happen as the embryo settles in.',
    ],
    lengthCm: 0.2,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a poppy seed',
    sizeEmoji: '⚫',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-4/',
  },
  {
    week: 5,
    developing: [
      'The brain and spinal cord are starting to form.',
      'The tiny heart is beginning to take shape and may beat for the first time around now.',
      'Early blood vessels are forming, including those of the umbilical cord.',
    ],
    mother: [
      'Many people find out they\'re pregnant around now.',
      'Feeling very tired, a bit queasy or having food cravings is common.',
      'It\'s normal to feel excited and worried at the same time. Share how you feel with someone you trust.',
    ],
    lengthCm: 0.2,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a sesame seed',
    sizeEmoji: '⚪',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-5/',
  },
  {
    week: 6,
    developing: [
      'Little buds are appearing that will become arms and legs, and tiny dents mark where the ears will be.',
      'The heart, brain and liver are developing quickly.',
      'A thin layer of see-through skin covers the embryo.',
    ],
    mother: [
      'Morning sickness can strike at any time of day. Small, regular snacks and plenty of rest help some people.',
      'Sore breasts, mood swings and a keen sense of smell are common.',
      'Mention anything that worries you, especially if you can\'t keep food down, to your midwife or LMC.',
    ],
    lengthCm: 0.6,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a pea',
    sizeEmoji: '🫛',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-6/',
  },
  {
    week: 7,
    developing: [
      'Your baby\'s brain is growing faster than the rest of the body, giving them a large forehead.',
      'Eyelids are starting to form, and the arm buds are lengthening into little hands.',
      'New brain cells are being made at an astonishing rate.',
    ],
    mother: [
      'You have more blood circulating than before, which can make you feel thirstier.',
      'Tiredness, nausea and mood swings can make this a challenging week.',
      'Your womb is growing, but you may not look pregnant for a while yet.',
    ],
    lengthCm: 1,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a grape',
    sizeEmoji: '🍇',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-7/',
  },
  {
    week: 8,
    developing: [
      'Your baby is growing very fast and the head is starting to uncurl.',
      'Arms are getting longer, and legs are following.',
      'Around now the embryo is called a fetus.',
    ],
    mother: [
      'Tiredness and nausea are still common.',
      'You may need to wee more often as your womb presses on your bladder.',
      'Feeling anxious or emotional is normal. Rest when you can and talk to your midwife or LMC if you\'re struggling.',
    ],
    lengthCm: 1.6,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a raspberry',
    sizeEmoji: '🌱',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-8/',
  },
  {
    week: 9,
    developing: [
      'Your baby\'s face is becoming more recognisable, with eyelids, a mouth and even a tongue.',
      'Fingers and toes are starting to separate, and bones are beginning to form.',
      'The major organs are all developing.',
    ],
    mother: [
      'Pregnancy hormones are at their peak, so you may feel like you\'re on an emotional rollercoaster.',
      'Extreme tiredness and nausea are common, but things often start to improve in the coming weeks.',
      'Little and often snacks can help keep nausea in check.',
    ],
    lengthCm: 2.2,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a strawberry',
    sizeEmoji: '🍓',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-9/',
  },
  {
    week: 10,
    developing: [
      'Your baby is having a growth spurt, and the face is looking more in proportion.',
      'Ears, nostrils and an upper lip are forming, and tiny tooth buds are hidden in the jaw.',
      'They make small, jerky movements that can be seen on an ultrasound.',
    ],
    mother: [
      'Your waistband may be feeling snug.',
      'Hormones relax your muscles, including your gut, so bloating, wind and heartburn are common.',
      'Smaller meals, eating slowly and a gentle walk after eating help some people.',
    ],
    lengthCm: 3,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'an apricot',
    sizeEmoji: '🌱',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-10/',
  },
  {
    week: 11,
    developing: [
      'Fingers and toes are separating and tiny nails are appearing.',
      'The head is still large but the body is catching up quickly.',
      'Your baby is kicking about, although you probably won\'t feel it for a while yet.',
    ],
    mother: [
      'Your body is pumping more blood, which can leave you feeling hot, sweaty or dizzy.',
      'Stretching muscles and ligaments can cause aches around your bump.',
      'The placenta is taking over from the yolk sac, which can leave you tired and emotional.',
      'Your midwife/LMC may talk to you about scans around this time.',
    ],
    lengthCm: 4.1,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a fig',
    sizeEmoji: '🌱',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-11/',
  },
  {
    week: 12,
    developing: [
      'Muscles and organs are growing, and the heartbeat can usually be heard on a scan.',
      'The skeleton is slowly hardening from soft tissue into bone.',
      'The sex organs have formed, though most scans can\'t tell yet.',
    ],
    mother: [
      'As the placenta takes over, hormones settle and nausea often eases.',
      'Your appetite may return, and your waist and breasts may be growing.',
      'Bump size varies a lot from person to person and doesn\'t tell you how baby is doing.',
      'Eating a balanced diet matters more than eating extra.',
    ],
    lengthCm: 5.4,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a plum',
    sizeEmoji: '🍑',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-12/',
  },
  {
    week: 13,
    developing: [
      'Baby\'s ovaries or testes are fully formed inside.',
      'Movements are shifting from jerky and random to more purposeful.',
      'Some babies suck their thumb, which helps them practise a sucking reflex.',
    ],
    mother: [
      'A small bump may start to show as your womb rises out of the pelvis.',
      'You might need to wee less often now.',
      'Gums can be sore or bleed easily, so a soft toothbrush helps.',
      'Some people notice a boost in energy or interest in sex, which is fine unless your midwife/LMC has advised otherwise.',
    ],
    lengthCm: 7.4,
    lengthNote: 'crown-rump',
    weightG: null,
    sizeObject: 'a peach',
    sizeEmoji: '🍑',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-13/',
  },
  {
    week: 14,
    developing: [
      'Baby\'s head is rounder and looks more in proportion with the body.',
      'They are kicking and stretching, although you probably can\'t feel it yet.',
      'They swallow small amounts of amniotic fluid and wee it back out.',
    ],
    mother: [
      'Your placenta is now working hard, passing oxygen and nutrients to your baby.',
      'You might notice yellowish stains in your bra, which is early milk (colostrum).',
      'Round ligament twinges and swollen, bleeding gums are common.',
      'Relationships can feel strained at times. Talking about it helps.',
    ],
    lengthCm: 8.5,
    lengthNote: 'crown-rump',
    weightG: 90,
    sizeObject: 'a kiwi fruit',
    sizeEmoji: '🥝',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-14/',
  },
  {
    week: 15,
    developing: [
      'A soft downy hair called lanugo is growing over baby\'s body.',
      'Eyebrows and eyelashes are starting to appear.',
      'Baby can sense light and may be starting to hear your voice.',
    ],
    mother: [
      'You might get odd jabbing pains at the sides of your bump (round ligament pain). Resting often helps.',
      'Skin can feel itchy and discharge can increase because of more blood flow to your pelvis.',
      'Let your midwife or doctor know about itching that gets worse, or discharge that smells or changes colour.',
    ],
    lengthCm: 10.1,
    lengthNote: 'crown-rump',
    weightG: 114,
    sizeObject: 'an apple',
    sizeEmoji: '🍎',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-15/',
  },
  {
    week: 16,
    developing: [
      'Baby is pulling faces, though there\'s no muscle control behind them yet.',
      'Their nervous system is developing, so arms and legs are moving and hands can make fists.',
      'You might start to feel flutters soon.',
    ],
    mother: [
      'Constipation is common. Fibre, water and gentle movement can help.',
      'You may have a routine antenatal check around now.',
      'Bloating, heartburn, nosebleeds and puffy gums are all common.',
    ],
    lengthCm: 11.6,
    lengthNote: 'crown-rump',
    weightG: 144,
    sizeObject: 'an avocado',
    sizeEmoji: '🥑',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-16/',
  },
  {
    week: 17,
    developing: [
      'Baby can move their eyes (still shut), open and close their mouth and react to loud noises.',
      'Fingernails are growing and unique fingerprints have formed.',
      'The placenta is growing too, feeding your baby and removing waste.',
    ],
    mother: [
      'Your waist is disappearing and you probably look more obviously pregnant.',
      'You may feel the first flutters, bubbles or rolls of movement, often between weeks 18 and 24.',
      'Stretch marks can appear on your tummy, breasts or thighs and usually fade after birth.',
      'Hormones can make small worries feel big. Reach out for support if you feel low.',
    ],
    lengthCm: 12,
    lengthNote: 'crown-rump',
    weightG: 179,
    sizeObject: 'a pomegranate',
    sizeEmoji: '🌱',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-17/',
  },
  {
    week: 18,
    developing: [
      'Baby\'s hearing, swallowing and sucking reflexes are developing.',
      'They\'re wriggling a lot, moving arms and legs.',
    ],
    mother: [
      'You may feel clumsier as your belly grows.',
      'Standing up quickly can make you dizzy because your blood pressure is a little lower.',
      'You may notice a dark line down your tummy (linea nigra), which is normal and fades after birth.',
      'Your midwife/LMC may talk to you about a detailed anatomy scan around now. You can choose whether you want to know baby\'s sex.',
    ],
    lengthCm: 14.2,
    lengthNote: 'crown-rump',
    weightG: 222,
    sizeObject: 'a capsicum',
    sizeEmoji: '🫑',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-18/',
  },
  {
    week: 19,
    developing: [
      'Baby\'s adult teeth are starting to form behind the first set.',
      'They\'re putting on weight to get ready for birth.',
    ],
    mother: [
      'The hormone relaxin loosens your ligaments, so back, knees and ankles can feel less supported and running may become uncomfortable.',
      'Sleep can be hard. Side-lying with pillows between your knees and under your bump may help.',
      'Pelvic aches, backache and leg cramps are common.',
      'Trust your instincts and share any worries with your midwife or LMC.',
    ],
    lengthCm: 15.3,
    lengthNote: 'crown-rump',
    weightG: 272,
    sizeObject: 'a large tomato',
    sizeEmoji: '🍅',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-19/',
  },
  {
    week: 20,
    developing: [
      'From now on baby is measured from head to heel, as the legs are less curled up.',
      'A creamy coating called vernix protects their delicate skin.',
      'They kick, punch, turn and may suck their thumb.',
    ],
    mother: [
      'You may be having a detailed scan this week, where the sonographer checks baby and your placenta.',
      'You may feel bubbling or fluttering movements.',
      'Sudden calf cramps at night are common. Pulling your toes up towards your ankle can ease them.',
    ],
    lengthCm: 25.6,
    lengthNote: 'crown-heel',
    weightG: 330,
    sizeObject: 'a banana',
    sizeEmoji: '🍌',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-20/',
  },
  {
    week: 21,
    developing: [
      'Baby is now heavier than the placenta.',
      'Fine lanugo hair covers their body, possibly helping to keep them at the right temperature.',
      'They can hear sounds and voices from outside the womb.',
    ],
    mother: [
      'Your balance may feel a bit off as your centre of gravity shifts. If you take a tumble, let your midwife/LMC know.',
      'Baby is developing waking and sleeping patterns, and may be most active when you want to sleep.',
      'Naps and a balanced diet with plenty of fruit and veg can help your energy.',
    ],
    lengthCm: 26.7,
    lengthNote: 'crown-heel',
    weightG: 398,
    sizeObject: 'a carrot',
    sizeEmoji: '🥕',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-21/',
  },
  {
    week: 22,
    developing: [
      'Baby\'s lungs are developing and they practise breathing movements.',
      'They swallow small amounts of amniotic fluid.',
      'Taste buds are developing.',
    ],
    mother: [
      'Stretch marks are common. They are harmless and usually fade after the birth.',
      'Haemorrhoids (piles) can appear and be itchy or sore.',
      'Contact your midwife/LMC promptly if you have severe pain or any bleeding.',
    ],
    lengthCm: 27.8,
    lengthNote: 'crown-heel',
    weightG: 476,
    sizeObject: 'a sweet potato',
    sizeEmoji: '🍠',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-22/',
  },
  {
    week: 23,
    developing: [
      'Baby\'s limbs are now in proportion.',
      'Their kicks are getting stronger and you may soon see your tummy move.',
    ],
    mother: [
      'Your breasts may start leaking a little colostrum, the first milk.',
      'Your growing baby pushes on your ribs and lungs, so you may feel rib pain or breathlessness. Putting your feet up helps.',
      'Skin is more sensitive to the sun, so cover up and use sun protection.',
      'Get to know baby\'s movement pattern and tell your midwife/LMC if it slows down.',
    ],
    lengthCm: 28.9,
    lengthNote: 'crown-heel',
    weightG: 565,
    sizeObject: 'a large mango',
    sizeEmoji: '🥭',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-23/',
  },
  {
    week: 24,
    developing: [
      'Baby is well proportioned, although smaller than a baby who has had longer in the womb.',
      'Babies born around now have a chance of survival with specialist neonatal care.',
    ],
    mother: [
      'You may feel really hungry. You don\'t need to eat much more until the third trimester.',
      'Aches in your back, ribs and elsewhere are common as hormones loosen ligaments.',
      'Every bump is different, so don\'t worry if yours is small.',
    ],
    lengthCm: 30,
    lengthNote: 'crown-heel',
    weightG: 665,
    sizeObject: 'a corn on the cob',
    sizeEmoji: '🌽',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-24/',
  },
  {
    week: 25,
    developing: [
      'Baby is very active and may jump at a loud noise.',
      'You may even feel little hiccups.',
      'Most of the fluid around them is now their wee, which cushions them and keeps their temperature steady.',
    ],
    mother: [
      'Face, hands and feet can get a bit puffy. Mention it to your midwife or doctor so they can check your blood pressure.',
      'Indigestion, heartburn and burping are common because baby is taking up space.',
      'Smaller meals, sitting up straight and avoiding rich or spicy food can help.',
      'Talk to someone if you\'re feeling stressed or alone. Support is available.',
    ],
    lengthCm: 34.6,
    lengthNote: 'crown-heel',
    weightG: 778,
    sizeObject: 'a courgette',
    sizeEmoji: '🥒',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-25/',
  },
  {
    week: 26,
    developing: [
      'Baby\'s eyes are opening for the first time and they\'re learning to blink.',
      'Eye colour isn\'t settled yet and can keep changing for years.',
    ],
    mother: [
      'There\'s lots of activity in your bump. Contact your midwife or birthing centre or hospital straight away if movements slow down or stop.',
      'Leg cramps may be more frequent, especially at night.',
      'Some people feel forgetful (\'baby brain\'), probably from tiredness and a busy mind.',
    ],
    lengthCm: 35.6,
    lengthNote: 'crown-heel',
    weightG: 902,
    sizeObject: 'a cucumber',
    sizeEmoji: '🥒',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-26/',
  },
  {
    week: 27,
    developing: [
      'Baby\'s lungs are now capable of breathing.',
      'Fat is filling out their wrinkly skin and their organs are maturing.',
    ],
    mother: [
      'Bloating and constipation are common. Water, fibre and fresh fruit and veg can help.',
      'Snoring is common because nasal passages can swell.',
      'From about now, lying on your side rather than your back is recommended for sleep. Pillows can help.',
      'If you plan to fly, check airline rules about travelling later in pregnancy.',
    ],
    lengthCm: 36.6,
    lengthNote: 'crown-heel',
    weightG: 1039,
    sizeObject: 'a head of cauliflower',
    sizeEmoji: '🥦',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-27/',
  },
  {
    week: 28,
    developing: [
      'Baby\'s heart beats much faster than yours.',
      'You may be able to hear it through a stethoscope.',
    ],
    mother: [
      'Heartburn and indigestion are common, and your back is under extra strain.',
      'Swelling in ankles, feet and face can be harmless, but mention it to your midwife or doctor so your blood pressure can be checked.',
      'Your midwife/LMC may talk to you about vaccinations that protect you and baby.',
      'Nosebleeds can happen because of hormones. Sit up, lean forward and pinch your nose.',
    ],
    lengthCm: 37.6,
    lengthNote: 'crown-heel',
    weightG: 1189,
    sizeObject: 'an eggplant',
    sizeEmoji: '🍆',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-28/',
  },
  {
    week: 29,
    developing: [
      'Baby is now fully formed and has lots of maturing and fat-gaining to do.',
      'The white coating (vernix) and downy hair start to disappear.',
    ],
    mother: [
      'You may feel breathless as baby pushes against your lungs.',
      'Baby can be most active when you want to sleep. Get to know their pattern and contact your midwife/LMC if it changes.',
      'Leg cramps and night-time trips to the toilet are common.',
      'You may feel awkward as your balance changes. Let your midwife/LMC know if you fall.',
    ],
    lengthCm: 38.6,
    lengthNote: 'crown-heel',
    weightG: 1350,
    sizeObject: 'a butternut pumpkin',
    sizeEmoji: '🎃',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-29/',
  },
  {
    week: 30,
    developing: [
      'Baby\'s eyes can now focus.',
      'Vision keeps developing after birth, and newborns focus best on faces close up.',
    ],
    mother: [
      'Disturbing dreams and poor sleep are common, fuelled by hormones and thoughts about the changes ahead.',
      'Talking about your dreams and worries can help. Tell your midwife/LMC if you feel very stressed.',
      'Stairs may leave you out of breath as baby presses on your lungs.',
    ],
    lengthCm: 39.9,
    lengthNote: 'crown-heel',
    weightG: 1523,
    sizeObject: 'a cabbage',
    sizeEmoji: '🥬',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-30/',
  },
  {
    week: 31,
    developing: [
      'Baby is very active, sucking fingers and doing the odd somersault.',
      'They\'re getting plumper and starting to recognise voices outside the womb.',
      'There\'s more amniotic fluid now that baby can wee.',
    ],
    mother: [
      'Your midwife/LMC may check the size of your bump and feel which way up baby is lying.',
      'Braxton Hicks (\'practice\') contractions can tighten your bump for 20 to 30 seconds. If they\'re painful or regular, contact your midwife/LMC.',
      'It\'s a good time to think about how you\'d like to feed your baby.',
    ],
    lengthCm: 41.1,
    lengthNote: 'crown-heel',
    weightG: 1707,
    sizeObject: 'a coconut',
    sizeEmoji: '🥥',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-31/',
  },
  {
    week: 32,
    developing: [
      'Baby is perfectly formed but still needs to put on weight.',
      'Extra fat will help them stay at the right temperature after birth.',
    ],
    mother: [
      'You may feel more tired than usual, so rest during the day.',
      'Baby is probably head down now, but there\'s still time if not.',
      'Space is getting tighter, but you should still feel regular movements. Contact your midwife or hospital promptly if the pattern changes.',
      'This is a good time to think about where you\'d like to give birth.',
    ],
    lengthCm: 42.4,
    lengthNote: 'crown-heel',
    weightG: 1901,
    sizeObject: 'a bunch of celery',
    sizeEmoji: '🥬',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-32/',
  },
  {
    week: 33,
    developing: [
      'Baby\'s brain and nervous system are fully developed.',
      'Bones are hardening, but the skull stays soft and flexible to help during birth.',
    ],
    mother: [
      'Practice contractions may be more frequent. Painful or regular ones need a call to your midwife/LMC.',
      'Only a small number of babies arrive on their due date, so it\'s wise to pack a hospital bag.',
      'Save key phone numbers and your hospital address in your phone.',
      'You may feel heaviness in your pelvis, which can mean baby is head down.',
    ],
    lengthCm: 43.7,
    lengthNote: 'crown-heel',
    weightG: 2103,
    sizeObject: 'a pineapple',
    sizeEmoji: '🍍',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-33/',
  },
  {
    week: 34,
    developing: [
      'Baby is curled up with legs bent towards their chest.',
      'It\'s cramped, but you should still feel them shifting around.',
    ],
    mother: [
      'If baby has dropped into your pelvis (\'lightening\'), breathing and heartburn may ease while the need to wee increases.',
      'Work can be tiring now. Do what feels right for you about when to stop.',
      'Your breasts may feel heavy and leak colostrum.',
    ],
    lengthCm: 45,
    lengthNote: 'crown-heel',
    weightG: 2312,
    sizeObject: 'a rockmelon',
    sizeEmoji: '🍈',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-34/',
  },
  {
    week: 35,
    developing: [
      'Baby is getting chubbier, which helps them keep warm after birth.',
      'Space is tight but they should still move strongly and regularly.',
    ],
    mother: [
      'You might get sore ribs as baby kicks. Severe pain should be checked by your midwife or doctor.',
      'Colostrum may leak from your breasts.',
      'You may like to think about pain relief options and write down your birth preferences.',
      'If baby\'s movements change or stop, contact your midwife or birthing centre or hospital straight away.',
    ],
    lengthCm: 46.2,
    lengthNote: 'crown-heel',
    weightG: 2527,
    sizeObject: 'a honeydew melon',
    sizeEmoji: '🍈',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-35/',
  },
  {
    week: 36,
    developing: [
      'Baby\'s lungs are probably mature enough to breathe on their own.',
      'They can suck and digest milk.',
    ],
    mother: [
      'Baby may have moved head down into your pelvis, though labour could still be weeks away.',
      'Your midwife/LMC can talk to you about options if baby isn\'t head down.',
      'You may leak a little wee when you laugh or cough. Pelvic floor exercises can help.',
      'This is a good time to learn about the stages of labour and the ways babies can be born.',
    ],
    lengthCm: 47.4,
    lengthNote: 'crown-heel',
    weightG: 2745,
    sizeObject: 'a cos lettuce',
    sizeEmoji: '🥬',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-36/',
  },
  {
    week: 37,
    developing: [
      'Baby is practising facial expressions, such as frowning and smiling, which are random reflexes.',
      'You probably know by now when they\'re active and when they\'re calm.',
    ],
    mother: [
      'Most babies are head down now, and your bump may drop as they engage.',
      'You may feel a nesting urge. Try not to overdo it and rest when you can.',
      'You may notice more discharge and practice contractions.',
      'Signs labour may be near include a \'show\', an urge to use the toilet, backache or regular contractions.',
    ],
    lengthCm: 48.6,
    lengthNote: 'crown-heel',
    weightG: 2966,
    sizeObject: 'a leek',
    sizeEmoji: '🌱',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-37/',
  },
  {
    week: 38,
    developing: [
      'Most of baby\'s downy hair has gone, though a few patches may remain.',
      'Meconium, a sticky green first poo, is building up in their bowel.',
    ],
    mother: [
      'Your midwife/LMC will keep checking your bump and blood pressure.',
      'You may like to talk to them about what happens if your baby comes later than expected.',
      'If you\'re planning a home birth, it helps to organise supplies and have a bag ready just in case.',
      'Frustration or boredom can set in. Hang in there.',
    ],
    lengthCm: 49.8,
    lengthNote: 'crown-heel',
    weightG: 3186,
    sizeObject: 'a stick of rhubarb',
    sizeEmoji: '🌱',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-38/',
  },
  {
    week: 39,
    developing: [
      'Baby\'s skin is thicker and more solid, protecting organs and helping control temperature.',
      'A waxy coating (vernix) may still cover them.',
    ],
    mother: [
      'You may notice a \'show\' (sticky mucus, perhaps pink or bloody). It can be an early sign of labour but there may still be days to go.',
      'Back pain and pelvic pressure are common as baby moves down.',
      'You may get bursts of energy and a nesting urge.',
      'Contact your midwife or hospital if contractions become regular and strong, if baby\'s movements change, or if you have any bleeding or other worries.',
    ],
    lengthCm: 50.7,
    lengthNote: 'crown-heel',
    weightG: 3403,
    sizeObject: 'a small watermelon',
    sizeEmoji: '🍉',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-39/',
  },
  {
    week: 40,
    developing: [
      'Baby is getting squashed but should still move in their usual pattern.',
      'They\'re ready to meet you whenever they decide to arrive.',
    ],
    mother: [
      'Lots of practice contractions are normal. Real labour contractions hurt and come in a regular rhythm.',
      'In early labour, rest if you can. During the day, stay upright and moving.',
      'Warm baths, breathing, massage and support from a birth partner can all help.',
      'Contact your midwife or birthing centre or hospital straight away if baby\'s movements slow or stop, or if you have any worries.',
    ],
    lengthCm: 51.2,
    lengthNote: 'crown-heel',
    weightG: 3617,
    sizeObject: 'a pumpkin',
    sizeEmoji: '🎃',
    sourceUrl: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-40/',
  },
];

export function getWeekInfo(week: number): WeekInfo | undefined {
  return WEEKS.find((w) => w.week === week);
}

/** Clamp a gestational week into the range the guide covers. */
export function clampGuideWeek(week: number): number {
  return Math.min(LAST_GUIDE_WEEK, Math.max(FIRST_GUIDE_WEEK, week));
}
