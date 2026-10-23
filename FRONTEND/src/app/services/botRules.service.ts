import { api, unwrap } from '../api/http';
import { Paginated } from '../api/types';

export type BotRule = Record<string, any>;

export const botRulesService = {
  list: (params?: Record<string, unknown>) => unwrap<Paginated<BotRule>>(api.get('/bot-rules', { params })),
  detail: (ruleId: number | string) => unwrap<BotRule>(api.get(`/bot-rules/${ruleId}`)),
  create: (payload: Record<string, unknown>) => unwrap<BotRule>(api.post('/bot-rules', payload)),
  update: ({ ruleId, payload }: { ruleId: number | string; payload: Record<string, unknown> }) => (
    unwrap<BotRule>(api.patch(`/bot-rules/${ruleId}`, payload))
  ),
  remove: (ruleId: number | string) => unwrap(api.delete(`/bot-rules/${ruleId}`)),
  execute: (payload: Record<string, unknown>) => unwrap(api.post('/bot-engine/execute', payload)),
  queue: (payload: Record<string, unknown>) => unwrap(api.post('/bot-engine/queue', payload)),
  queueStatus: () => unwrap(api.get('/bot-engine/queue/status')),
  test: (payload: { text: string }) => unwrap<Record<string, any>>(api.post('/bot-engine/test', payload)),
};
