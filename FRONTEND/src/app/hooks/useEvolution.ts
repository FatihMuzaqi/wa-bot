import { useQuery } from '@tanstack/react-query';
import { evolutionService } from '../services/evolution.service';

export const useEvolutionStatus = (instanceName = 'default') => useQuery({
  queryKey: ['evolution', 'status', instanceName],
  queryFn: () => evolutionService.status(instanceName),
  refetchInterval: 30000,
});

export const useEvolutionQr = (instanceName = 'default') => useQuery({
  queryKey: ['evolution', 'qr', instanceName],
  queryFn: () => evolutionService.qr(instanceName),
  enabled: false,
});
