import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseService } from '../firebase-service';
import type { CreateTerminalReceiptData } from '../../types';

/**
 * Query hook to fetch terminal receipts
 */
export function useTerminalReceipts() {
  return useQuery({
    queryKey: ['terminal-receipts'],
    queryFn: () => firebaseService.getTerminalReceipts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Mutation hook to create a new terminal receipt
 */
export function useCreateTerminalReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTerminalReceiptData) =>
      firebaseService.createTerminalReceipt(data),
    onSuccess: () => {
      // Invalidate and refetch terminal receipts
      queryClient.invalidateQueries({ queryKey: ['terminal-receipts'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create terminal receipt:', error);
    },
  });
}

/**
 * Mutation hook to update an existing terminal receipt
 */
export function useUpdateTerminalReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateTerminalReceiptData;
    }) => firebaseService.updateTerminalReceipt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-receipts'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update terminal receipt:', error);
    },
  });
}

/**
 * Mutation hook to delete a terminal receipt
 */
export function useDeleteTerminalReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => firebaseService.deleteTerminalReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-receipts'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete terminal receipt:', error);
    },
  });
}

/**
 * Query hook to calculate terminal receipt statistics
 */
export function useTerminalReceiptStats() {
  const { data: receipts, ...rest } = useTerminalReceipts();

  const stats = {
    totalReceipts: receipts?.length || 0,
    totalVolume:
      receipts?.reduce((sum, r) => sum + r.final_volume_bbl, 0) || 0,
    averageTemperature:
      receipts && receipts.length > 0
        ? receipts.reduce((sum, r) => sum + r.temperature_degF, 0) /
          receipts.length
        : 0,
  };

  return {
    ...rest,
    data: stats,
    receipts,
  };
}
