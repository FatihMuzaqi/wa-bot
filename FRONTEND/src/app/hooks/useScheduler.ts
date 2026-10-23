import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schedulerService } from '../services/scheduler.service';

export const useSchedules = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['schedules', params],
  queryFn: () => schedulerService.list(params),
});

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulerService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });
};
