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

## Notes

- All health guidance shown in the app (the contraction timer panels, past-due prompt, pre-eclampsia note and kick-session guidance) lives in `src/data/guidance.ts`. It is general guidance attributed to Health NZ/NHS, not a diagnosis, and it still needs clinical sign-off.

- Lengths (crown-rump before week 14, crown-heel from week 14) and weights are typical averages, not targets.
  Weights are the WHO 50th percentile and only exist from week 14. The size-comparison objects follow the NHS
  guide, so from week 14 they won't always match the crown-heel length.
- Baby illustrations are AI-generated stylised art, not medical images. There are no illustrations for weeks
  32/36/40, so the week 28 image is used from week 28 onwards.
- Content is general information only, not medical advice.
