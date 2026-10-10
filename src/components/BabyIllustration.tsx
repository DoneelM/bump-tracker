import { stageForWeek, stageImagePath } from '../lib/stages';

/** Stylised AI-generated baby illustration for the closest stage at or below `week`. */
export function BabyIllustration({ week, size = 160 }: { week: number; size?: number }) {
  return (
    <img
      className="baby-illustration"
      src={`${import.meta.env.BASE_URL}${stageImagePath(week)}`}
      alt={`Stylised illustration of a baby at about ${stageForWeek(week)} weeks of pregnancy`}
      width={size}
      height={size}
      loading="lazy"
    />
  );
}
