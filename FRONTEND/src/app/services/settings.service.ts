import { authService } from './auth.service';
import { api, unwrap } from '../api/http';

export const settingsService = {
  profile: authService.profile,
  list: (params?: Record<string, unknown>) => unwrap<Record<string, any>[]>(api.get('/settings', { params })),
  get: (key: string) => unwrap<Record<string, any>>(api.get(`/settings/${key}`)),
  save: (payload: Record<string, unknown>) => unwrap<Record<string, any>>(api.post('/settings', payload)),
  update: (key: string, payload: Record<string, unknown>) => unwrap<Record<string, any>>(api.patch(`/settings/${key}`, payload)),
};
