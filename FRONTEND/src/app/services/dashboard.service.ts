import { api, unwrap } from '../api/http';

export type DashboardOverview = {
  summary: Record<string, number>;
  analytics?: Record<string, any>;
  messageTrend: Array<Record<string, any>>;
  handlingTrend: Array<Record<string, any>>;
  broadcastPerformance: Array<Record<string, any>>;
  recentActivity: Array<Record<string, any>>;
  systemHealth: Record<string, any>;
};

export const dashboardService = {
  overview: () => unwrap<DashboardOverview>(api.get('/dashboard')),
  summary: () => unwrap<Record<string, number>>(api.get('/dashboard/summary')),
  analytics: () => unwrap<Record<string, any>>(api.get('/dashboard/analytics')),
  trends: () => unwrap<Record<string, any>>(api.get('/dashboard/trends')),
  activity: () => unwrap<Record<string, any>[]>(api.get('/dashboard/activity')),
  health: () => unwrap<Record<string, any>>(api.get('/dashboard/health')),
};
