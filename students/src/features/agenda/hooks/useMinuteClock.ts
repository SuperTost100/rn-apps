import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const msToNextMinute = (now: number) => 60000 - (now % 60000);

/**
 * The time, updated when a new minute starts and when the app comes back
 * to the foreground. Only the component that calls it re-renders.
 */
export const useMinuteClock = () => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(Date.now());
      timer = setTimeout(tick, msToNextMinute(Date.now()) + 50);
    };
    timer = setTimeout(tick, msToNextMinute(Date.now()) + 50);
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      clearTimeout(timer);
      tick();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
  return now;
};
