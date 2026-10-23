import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';

export const useSettingsProfile = () => useQuery({
  queryKey: ['settings', 'profile'],
  queryFn: settingsService.profile,
});

export const useSettings = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['settings', params],
  queryFn: () => settingsService.list(params),
});

export const useSaveSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.save,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};
