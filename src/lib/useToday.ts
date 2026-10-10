import { useEffect, useState } from 'react';
import { todayLocal, type LocalDate } from './dates';

/**
 * Today's local calendar date. Re-checks every minute and when the app becomes
 * visible again, so a tab left open overnight rolls over to the new day.
 */
export function useToday(): LocalDate {
  const [today, setToday] = useState(todayLocal);

  useEffect(() => {
    const update = () => setToday(todayLocal());
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return today;
}
