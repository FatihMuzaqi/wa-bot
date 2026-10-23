import { api, unwrap } from '../api/http';
import { Paginated } from '../api/types';

export type Schedule = Record<string, any>;

export const schedulerService = {
  list: (params?: Record<string, unknown>) => unwrap<Paginated<Schedule>>(api.get('/schedules', { params })),
  detail: (scheduleId: number | string) => unwrap<Schedule>(api.get(`/schedules/${scheduleId}`)),
  create: (payload: Record<string, unknown>) => unwrap<Schedule>(api.post('/schedules', payload)),
  createReminder: (payload: Record<string, unknown>) => unwrap<Schedule>(api.post('/schedules/reminders', payload)),
  scheduleCampaign: (payload: { broadcastId: number | string; scheduledAt: string }) => (
    unwrap(api.post('/schedules/campaigns/schedule', payload))
  ),
  runDue: () => unwrap(api.post('/schedules/run-due')),
  pause: (scheduleId: number | string) => unwrap<Schedule>(api.post(`/schedules/${scheduleId}/pause`)),
  resume: (scheduleId: number | string) => unwrap<Schedule>(api.post(`/schedules/${scheduleId}/resume`)),
};
