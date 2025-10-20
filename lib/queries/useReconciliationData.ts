import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { firebaseService } from '../firebase-service';

/**
 * Query hook to fetch reconciliation runs with REAL-TIME updates
 * @param limit - Optional limit for the number of runs to fetch
 */
export function useReconciliationRuns(limit?: number) {
  const queryClient = useQueryClient();

  // Set up real-time listener
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToReconciliationRuns((runs) => {
      const limitedRuns = limit ? runs.slice(0, limit) : runs;
      // Update React Query cache with real-time data
      queryClient.setQueryData(['reconciliation-runs', limit], limitedRuns);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [limit, queryClient]);

  return useQuery({
    queryKey: ['reconciliation-runs', limit],
    queryFn: async () => {
      // Initial fetch (subscription will handle updates)
      const runs = await firebaseService.getReconciliationRuns();
      return limit ? runs.slice(0, limit) : runs;
    },
    staleTime: Infinity, // Data is always fresh from real-time listener
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false, // No need to refetch, we have real-time updates
  });
}

/**
 * Query hook to fetch a specific reconciliation report
 * @param reconciliationId - ID of the reconciliation run
 */
export function useReconciliationReport(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['reconciliation-report', reconciliationId],
    queryFn: () => {
      if (!reconciliationId) {
        throw new Error('Reconciliation ID is required');
      }
      return firebaseService.getReconciliationReport(reconciliationId);
    },
    enabled: !!reconciliationId, // Only run query if ID is provided
    staleTime: 10 * 60 * 1000, // 10 minutes - reports don't change once created
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Query hook to fetch period summary for reconciliation
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 */
export function useReconciliationPeriodSummary(
  startDate: Date | null,
  endDate: Date | null
) {
  return useQuery({
    queryKey: ['reconciliation-period-summary', startDate, endDate],
    queryFn: () => {
      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }
      return firebaseService.getReconciliationSummaryForPeriod(
        startDate,
        endDate
      );
    },
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes - period summary can change as data is added
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Mutation hook to trigger a new reconciliation
 */
export function useTriggerReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      startDate,
      endDate,
      userId,
    }: {
      startDate: Date;
      endDate: Date;
      userId: string;
    }) => {
      // First check if reconciliation already exists
      const existingCheck = await firebaseService.checkExistingReconciliation(
        startDate,
        endDate
      );

      if (existingCheck.exists) {
        throw new Error(existingCheck.message);
      }

      return firebaseService.triggerReconciliation(startDate, endDate, userId);
    },
    onSuccess: () => {
      // Invalidate reconciliation runs to refetch the list
      queryClient.invalidateQueries({ queryKey: ['reconciliation-runs'] });
    },
    onError: (error: Error) => {
      console.error('Failed to trigger reconciliation:', error);
    },
  });
}

/**
 * Query hook to calculate reconciliation statistics
 */
export function useReconciliationStats(limit?: number) {
  const { data: runs, ...rest } = useReconciliationRuns(limit);

  const stats = {
    totalRuns: runs?.length || 0,
    completedRuns:
      runs?.filter((run) => run.status === 'completed').length || 0,
    totalVolume:
      runs?.reduce((sum, run) => sum + run.total_terminal_volume, 0) || 0,
  };

  return {
    ...rest,
    data: stats,
    runs,
  };
}
