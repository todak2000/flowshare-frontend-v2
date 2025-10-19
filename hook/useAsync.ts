import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for managing async operations
 * @param asyncFn - The async function to execute
 * @returns Object with data, loading, error states and execute function
 *
 * @example
 * ```ts
 * const { data, loading, error, execute } = useAsync(firebaseService.createProductionEntry);
 *
 * const handleSubmit = async () => {
 *   try {
 *     await execute(formData);
 *     alert('Success!');
 *   } catch (err) {
 *     // Error already in state
 *   }
 * };
 * ```
 */
export function useAsync<T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });

      try {
        const data = await asyncFn(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        setState({ data: null, loading: false, error: errorObj });
        throw errorObj;
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
