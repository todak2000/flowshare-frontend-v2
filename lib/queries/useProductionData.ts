import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseService } from '../firebase-service';
import type { ProductionEntry, CreateProductionEntryData } from '../../types';

/**
 * Query hook to fetch production entries
 * @param partnerId - Optional partner ID to filter entries
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 */
export function useProductionEntries(
  partnerId?: string,
  startDate?: Date,
  endDate?: Date
) {
  return useQuery({
    queryKey: ['production-entries', partnerId, startDate, endDate],
    queryFn: () =>
      firebaseService.getProductionEntries(partnerId, startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Mutation hook to create a new production entry
 */
export function useCreateProductionEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductionEntryData) =>
      firebaseService.createProductionEntry(data),
    onSuccess: () => {
      // Invalidate and refetch all production entries queries
      queryClient.invalidateQueries({ queryKey: ['production-entries'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create production entry:', error);
    },
  });
}

/**
 * Mutation hook to update an existing production entry
 */
export function useUpdateProductionEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductionEntry> }) =>
      firebaseService.updateProductionEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-entries'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update production entry:', error);
    },
  });
}

/**
 * Mutation hook to delete a production entry
 */
export function useDeleteProductionEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => firebaseService.deleteProductionEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-entries'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete production entry:', error);
    },
  });
}

/**
 * Query hook to fetch production statistics
 */
export function useProductionStats(
  partnerId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const { data: entriesResponse, ...rest } = useProductionEntries(
    partnerId,
    startDate,
    endDate
  );

  const entries = entriesResponse?.data || [];

  const stats = {
    totalEntries: entries.length,
    totalVolume: entries.reduce((sum, e) => sum + e.gross_volume_bbl, 0),
    averageAPIGravity:
      entries.length > 0
        ? entries.reduce((sum, e) => sum + e.api_gravity, 0) / entries.length
        : 0,
  };

  return {
    ...rest,
    data: stats,
    entries,
  };
}
