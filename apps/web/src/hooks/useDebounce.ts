import { useEffect, useState } from 'react';

/**
 * useDebounce hook
 * Returns a debounced value that only updates after the specified delay
 * Useful for auto-save functionality and reducing API calls
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * const [text, setText] = useState('');
 * const debouncedText = useDebounce(text, 2000);
 *
 * useEffect(() => {
 *   // This only runs 2 seconds after the user stops typing
 *   saveToAPI(debouncedText);
 * }, [debouncedText]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay elapses
    // or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
