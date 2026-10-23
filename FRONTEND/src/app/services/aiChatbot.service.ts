import { api, unwrap } from '../api/http';

export const aiChatbotService = {
  generate: (payload: { question: string; conversation?: Array<{ role: string; content: string }> }) => (
    unwrap<Record<string, any>>(api.post('/ai/generate', payload))
  ),
  prompts: () => unwrap<Record<string, any>[]>(api.get('/ai/prompts')),
  createPrompt: (payload: Record<string, unknown>) => unwrap(api.post('/ai/prompts', payload)),
  updatePrompt: (promptId: number | string, payload: Record<string, unknown>) => (
    unwrap(api.patch(`/ai/prompts/${promptId}`, payload))
  ),
  deletePrompt: (promptId: number | string) => unwrap(api.delete(`/ai/prompts/${promptId}`)),
  knowledgeSources: () => unwrap<Record<string, any>[]>(api.get('/ai/knowledge-sources')),
  knowledgeSource: (sourceId: number | string) => unwrap<Record<string, any>>(api.get(`/ai/knowledge-sources/${sourceId}`)),
  createKnowledgeSource: (payload: Record<string, unknown> | FormData) => unwrap(api.post('/ai/knowledge-sources', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })),
  addKnowledgeDocument: (sourceId: number | string, payload: Record<string, unknown>) => (
    unwrap(api.post(`/ai/knowledge-sources/${sourceId}/documents`, payload))
  ),
  uploadKnowledgeDocument: (sourceId: number | string, payload: FormData) => (
    unwrap(api.post(`/ai/knowledge-sources/${sourceId}/documents`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }))
  ),
  deleteKnowledgeSource: (sourceId: number | string) => unwrap(api.delete(`/ai/knowledge-sources/${sourceId}`)),
  addFaq: (payload: Record<string, unknown>) => unwrap(api.post('/ai/faqs', payload)),
};
