
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  // Added undefined as initial value to resolve "Expected 1 arguments, but got 0" error
  const savedCallback = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
