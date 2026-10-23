import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { botRulesService } from '../services/botRules.service';

export const useBotRules = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['bot-rules', params],
  queryFn: () => botRulesService.list(params),
});

export const useCreateBotRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botRulesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-rules'] }),
  });
};

export const useUpdateBotRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botRulesService.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-rules'] }),
  });
};

export const useDeleteBotRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botRulesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-rules'] }),
  });
};

export const useBotQueueStatus = () => useQuery({
  queryKey: ['bot-engine', 'queue-status'],
  queryFn: botRulesService.queueStatus,
});

export const useTestBotRule = () => useMutation({
  mutationFn: botRulesService.test,
});
