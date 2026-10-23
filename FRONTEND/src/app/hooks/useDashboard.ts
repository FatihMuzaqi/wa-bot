import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useDashboardOverview = () => useQuery({
  queryKey: ['dashboard', 'overview'],
  queryFn: dashboardService.overview,
});

export const useDashboardSummary = () => useQuery({
  queryKey: ['dashboard', 'summary'],
  queryFn: dashboardService.summary,
});

export const useDashboardAnalytics = () => useQuery({
  queryKey: ['dashboard', 'analytics'],
  queryFn: dashboardService.analytics,
});
