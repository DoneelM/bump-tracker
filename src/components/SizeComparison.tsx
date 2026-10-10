import type { WeekInfo } from '../data/weeks';
import { BabyIllustration } from './BabyIllustration';

/** Baby illustration beside a large emoji of the size-comparison object. */
export function SizeComparison({ info, size }: { info: WeekInfo; size?: number }) {
  return (
    <figure className="size-comparison">
      <div className="size-comparison__visual">
        <BabyIllustration week={info.week} size={size} />
        <span className="size-comparison__emoji" aria-hidden="true">
          {info.sizeEmoji}
        </span>
      </div>
      <figcaption className="size-comparison__caption">About the size of {info.sizeObject}</figcaption>
    </figure>
  );
}
