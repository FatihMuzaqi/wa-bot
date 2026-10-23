import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { broadcastService } from '../services/broadcast.service';

export const useBroadcasts = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['broadcasts', params],
  queryFn: () => broadcastService.list(params),
});

export const useCreateBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
};

export const useImportBroadcastExcel = () => useMutation({
  mutationFn: broadcastService.importExcel,
});

export const useStartBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastService.start,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
};

export const useCancelBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastService.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
};

export const useDeleteBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: broadcastService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcasts'] }),
  });
};

export const useBroadcastDetail = (broadcastId?: number | string | null) => useQuery({
  queryKey: ['broadcasts', 'detail', broadcastId],
  queryFn: () => broadcastService.detail(broadcastId as number | string),
  enabled: Boolean(broadcastId),
});
