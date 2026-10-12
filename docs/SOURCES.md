# Sources

Keep in sync with `src/data/sources.ts`.

| Source | Publisher | How it is used |
| --- | --- | --- |
| [Week-by-week guide to pregnancy](https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/) | NHS | Weekly "what's developing" / "what you might notice" text (paraphrased, UK-specific details removed), size-comparison objects (NZ names, e.g. capsicum, eggplant), and baby length for weeks 4-5 only. |
| [Fetal development](https://www.perinatology.com/Reference/Fetal%20development.htm) | Perinatology.com | Typical baby length for weeks 6-40 (crown-rump to week 13, crown-heel from week 14, where this source switches). Page reviewed 12/6/2025; values checked by `scripts/week-lengths.test.mjs`. |
| [WHO Fetal Growth Charts - Kiserud et al. 2017, PLOS Medicine 14(1): e1002220](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002220) | PLOS Medicine / WHO | Typical baby weight: estimated fetal weight (50th percentile, Table 11) for weeks 14-40 in the week guide, and the median + 10th-90th percentile band on the scans chart. |
| [Fetal development: The first trimester](https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/prenatal-care/art-20045302) | Mayo Clinic | Background reference for first-trimester development. |
| [Fetal development: The 2nd trimester](https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20046151) | Mayo Clinic | Background reference for second-trimester development. |
| [Fetal development: The 3rd trimester](https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20045997) | Mayo Clinic | Background reference for third-trimester development. |
| [How your fetus grows during pregnancy](https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy) | ACOG | Background reference for general fetal growth information. |
| [Methods for estimating the due date](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date) | ACOG | Due date and gestational age calculations. |
| [Pregnancy and maternity](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity) | Health NZ | NZ context: working with your midwife/LMC. |
| [Pregnancy and your baby's movements](https://info.health.nz/pregnancy-maternity/having-a-healthy-pregnancy/pregnancy-and-your-babys-movements) | Health NZ | Baby movement guidance (kick counter and kick-session guidance), the past-due-date prompt, and when first movements are usually felt: "between 16 and 22 weeks" (week 17 text). |
| [Going into labour](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/going-into-labour) | Health NZ | Labour signs and when to call (contraction timer), the "when to contact your midwife/LMC" panel and the past-due-date prompt. Note: Health NZ's threshold (contractions every 5 min, lasting >50 s, getting stronger for 2-3 hours) differs from the generic 5-1-1 rule; the app shows both. |
| [Premature birth and care of your pēpi](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/labour-and-birth/premature-birth) | Health NZ | Signs of labour before 37 weeks: contact your midwife/LMC as soon as possible (contraction timer). |
| [Preeclampsia](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/pre-eclampsia) | Health NZ | Pre-eclampsia warning signs (journal). |
| [Common issues in pregnancy](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/health-problems-in-pregnancy/common-issues) | Health NZ | Danger signs that need prompt advice (journal; waters breaking in the contraction timer panel). |
| [Pre-eclampsia](https://www.nhs.uk/conditions/pre-eclampsia/) | NHS | Pre-eclampsia warning signs (journal). |
| [Your baby's movements](https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/) | NHS | Baby movement guidance (kick counter and kick-session guidance), and the week 17 note that with a first baby movements may not be felt until after 20 weeks. |
| [Signs that labour has begun](https://www.nhs.uk/pregnancy/labour-and-birth/signs-of-labour/signs-that-labour-has-begun/) | NHS | Background for the 5-1-1 prompt on the contraction timer (when to call for advice). |
| [Induction of Labour in Aotearoa New Zealand (2019, final 2021)](https://www.midwife.org.nz/wp-content/uploads/2020/02/induction-of-labour-in-Aotearoa-New-Zealand-guideline-2019.pdf) | Ministry of Health | Induction usually offered between 41 and 42 weeks for a straightforward pregnancy (past-due prompt). |
| [Weight Gain During Pregnancy: Reexamining the Guidelines](https://www.nationalacademies.org/read/12584/chapter/2) | Institute of Medicine (2009) | Total gain ranges by pre-pregnancy BMI (Table S-1, singleton pregnancy). The weekly band in the chart is an approximation (0.5-2 kg by week 13, then linear to the total range at week 40). |
| [Healthline](https://www.healthnz.govt.nz/online-phone-healthcare/healthline) | Health NZ | Healthline number (0800 611 116) on the call cards and the Warning signs page. Checked 11/10/2026. |
| [List of safe food in pregnancy](https://www.mpi.govt.nz/food-safety-home/food-pregnancy/list-safe-food-pregnancy) | New Zealand Food Safety (MPI) | Food safety guide (Tools): each food's advice follows MPI's table closely, plus MPI's fish servings for mercury. Checked 11/10/2026. |
| [Nutrients and supplements in pregnancy](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/having-a-healthy-pregnancy/nutrients-and-supplements-in-pregnancy) | Health NZ | Supplements screen: folic acid 0.8 mg daily from 4 weeks before until 12 weeks (longer with more than 1 pēpi), iodine 150 micrograms daily while pregnant and breastfeeding, both free on prescription. Checked 11/10/2026. |
| [Choking](https://www.healthnz.govt.nz/health-topics/tests-and-treatments/emergencies-and-first-aid/choking) | Health NZ | Baby choking steps on the Help tab, word for word (back blows and chest thrusts; the back-blow lines are ordered so placing the baby comes first). Checked 12/10/2026. |
| [CPR for babies under 12 months](https://www.kidshealth.org.nz/cpr/emergencies-cpr-for-babies-under-12-months) | KidsHealth | Baby CPR on the Help tab: all seven DRSABCD steps, word for word and unchanged (KidsHealth's terms). Health NZ's CPR page sends readers here for babies. Last reviewed 7 October 2026; checked 13/10/2026. Replaces the St John text, whose site is all rights reserved. |
| [Is my child sick?](https://www.kidshealth.org.nz/is-my-child-sick) | KidsHealth | When to call 111, see a health professional urgently, or call Healthline (Help tab). Page last reviewed 9 June 2025; checked 12/10/2026. |
| [National Immunisation Schedule](https://www.healthnz.govt.nz/health-topics/immunisations/national-immunisation-schedule) and [Immunisations for babies and toddlers](https://www.healthnz.govt.nz/health-topics/immunisations/when-to-immunise/babies-and-toddlers) | Health NZ | Immunisations screen: visits at 6 weeks, 3, 5, 12 and 15 months and 4 years, the vaccines and dose numbers at each, free for under 18s, premature babies from 6 weeks, catch-ups, and the flu recommendation from 6 months. Checked 12/10/2026. |
| [Get help now](https://pada.nz/get-help-now/) | PADA | Baby mode support: Lifeline 0800 543 354 (or text HELP to 4357), Samaritans 0800 726 666, 1737, PlunketLine, who to talk to, and the "you are not alone" line. Checked 12/10/2026. |
| [Normal changes to your body after birth](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/you-and-your-newborn/normal-changes-to-your-body-after-birth) and [Problems in the week after the birth](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/you-and-your-newborn/problems-in-the-week-after-the-birth) | Health NZ | "After the birth: your health" on the Help tab: the "talk to your midwife" lines for bleeding, swollen legs, breasts, stitches and stinging, and "get help straight away" for a possible blood clot, word for word under our own headings (adapted). Last updated 22 July 2026; checked 13/10/2026. |
| [Maternal birth injuries](https://healthify.nz/health-a-z/m/maternal-birth-injuries) | Healthify | Linked from the Help tab for a longer list of signs. No text reproduced: Healthify is all rights reserved and doesn't allow commercial use without permission. |
| [Safe sleep: birth to 11 months](https://www.starship.org.nz/safekids/safe-sleep-birth-to-11-months/) | Starship Safekids | Safe sleep card on Home in baby mode: A.B.C. (alone, on their backs, in a cot every time) and three top tips, word for word. Checked 12/10/2026. |
| [PlunketLine](https://www.plunket.org.nz/plunket-and-you/services-we-offer/plunketline/) | Whānau Āwhina Plunket | PlunketLine number (0800 933 922, free 24/7, tamariki 0-5), shown once the baby is born. Checked 11/10/2026. |
| [1737, Need to talk?](https://1737.org.nz/) | 1737 | Free call or text 1737, 24/7, shown if a pregnancy has ended. Checked 11/10/2026. |
| [Sands New Zealand](https://www.sands.org.nz/) | Sands New Zealand | Support after the death of a baby at any stage of pregnancy, including medical termination, shown if a pregnancy has ended. Checked 11/10/2026. |
| [Miscarriage Support](https://www.miscarriagesupport.org.nz/) | Miscarriage Support NZ | Support and information after miscarriage, shown if a pregnancy has ended. Checked 11/10/2026. |
| [Finding out you are pregnant](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/finding-out-you-are-pregnant) | Health NZ | Timeline: find a lead maternity carer as soon as you know you're pregnant. Checked 11/10/2026. |
| [Lead maternity carers](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/lead-maternity-carers) | Health NZ | Timeline: what an LMC does; care until pēpi is 6 weeks old. Checked 11/10/2026. |
| [Blood tests in pregnancy](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/blood-tests-pregnancy) | Health NZ | Timeline: first antenatal blood tests as soon as possible. Its anti-D section covers bleeding events only, so the timeline has no routine anti-D milestone. Checked 11/10/2026. |
| [Diabetes testing in pregnancy](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/diabetes-testing-pregnancy) | Health NZ | Timeline: HbA1c with the first bloods; oral glucose challenge test at 24-28 weeks if not at high risk. Checked 11/10/2026. |
| [Screening for Down syndrome and other conditions](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/down-syndrome-other-conditions) | Health NZ | Timeline: blood test best at 9-10 weeks (to 13w6d) plus nuchal translucency scan best 12w0d-13w6d; or blood test only at 14-20 weeks (best 14-18). Checked 11/10/2026. |
| [Checking the growth, development and heart health of your pēpi](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-newborn-screening/baby-health-checks) | Health NZ | Timeline: fetal anatomy scan between 18 and 20 weeks. Note: this page gives the nuchal translucency scan as "between 11 and 14 weeks, best at 12", wider than the screening page; the timeline uses the screening page's window. Checked 11/10/2026. |
| [Pregnancy and immunisations](https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/pregnancy-and-immunisations) | Health NZ | Timeline: whooping cough vaccine free from 13 weeks, most effective from 16; flu vaccine free at any stage. Checked 11/10/2026. |

## Licences

Checked 13/10/2026. Each entry in `src/data/sources.ts` has a `licence`, and `SourceNote` shows the credit it needs next to reproduced text.

| Licence | Sources | What it lets us do |
| --- | --- | --- |
| CC BY 4.0 | Health NZ, MPI, PLOS Medicine / WHO | Reuse, including commercially, with credit and a link to the licence. Say when we changed the text (Health NZ choking and after-birth lines are marked adapted). MPI asks for its own credit line, used as is. |
| Open Government Licence v3.0 | NHS | Paraphrased only. Credit "Contains public sector information licensed under the Open Government Licence v3.0". |
| KidsHealth terms | KidsHealth (baby CPR, "Is my child sick?") | Free to reproduce unchanged, with credit and its disclaimers, but not sold or used to promote a product. Needs written permission before the app is paid. |
| Safekids terms | Starship Safekids (safe sleep) | Unchanged, with credit, not sold. Needs written permission before the app is paid. |
| Facts and links only | Mayo Clinic, ACOG, Perinatology.com, IOM, Ministry of Health guideline, Healthify, Plunket, 1737, Sands, Miscarriage Support, St John (video and course links) | No text reproduced. |
| Not yet confirmed | PADA ("you are not alone" line) | Check before charging, or reword. |

## Notes

- All health guidance shown in the app (the contraction timer panels, past-due prompt, pre-eclampsia note and kick-session guidance) lives in `src/data/guidance.ts`. It is general guidance attributed to Health NZ/NHS, not a diagnosis, and it still needs clinical sign-off.

- Lengths (crown-rump before week 14, crown-heel from week 14) and weights are typical averages, not targets.
  Weights are the WHO 50th percentile and only exist from week 14. The size-comparison objects follow the NHS
  guide, so from week 14 they won't always match the crown-heel length.
- Baby illustrations are AI-generated stylised art, not medical images. There are no illustrations for weeks
  32/36/40, so the week 28 image is used from week 28 onwards.
- Content is general information only, not medical advice.
