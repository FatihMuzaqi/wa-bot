import { api, unwrap } from '../api/http';
import { Paginated } from '../api/types';

export type Broadcast = Record<string, any>;

export const broadcastService = {
  list: (params?: Record<string, unknown>) => unwrap<Paginated<Broadcast>>(api.get('/broadcasts', { params })),
  detail: (broadcastId: number | string) => unwrap<Broadcast>(api.get(`/broadcasts/${broadcastId}`)),
  create: (payload: Record<string, unknown>) => unwrap<Broadcast>(api.post('/broadcasts', payload)),
  update: ({ broadcastId, payload }: { broadcastId: number | string; payload: Record<string, unknown> }) => (
    unwrap<Broadcast>(api.patch(`/broadcasts/${broadcastId}`, payload))
  ),
  remove: (broadcastId: number | string) => unwrap(api.delete(`/broadcasts/${broadcastId}`)),
  importExcel: (formData: FormData) => unwrap<Record<string, any>>(api.post('/broadcasts/import-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })),
  schedule: (broadcastId: number | string, scheduledAt: string) => (
    unwrap<Broadcast>(api.post(`/broadcasts/${broadcastId}/schedule`, { scheduledAt }))
  ),
  start: (broadcastId: number | string) => unwrap<Broadcast>(api.post(`/broadcasts/${broadcastId}/send-now`)),
  cancel: (broadcastId: number | string) => unwrap<Broadcast>(api.post(`/broadcasts/${broadcastId}/cancel`)),
  retryFailed: (broadcastId: number | string) => unwrap(api.post(`/broadcasts/${broadcastId}/retry-failed`)),
  recipients: (broadcastId: number | string) => unwrap<Record<string, any>[]>(api.get(`/broadcasts/${broadcastId}/recipients`)),
  logs: (broadcastId: number | string) => unwrap<Record<string, any>[]>(api.get(`/broadcasts/${broadcastId}/logs`)),
  queueStatus: () => unwrap(api.get('/broadcasts/queue/status')),
};
