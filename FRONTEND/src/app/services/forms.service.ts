import { api, unwrap } from '../api/http';
import { Paginated } from '../api/types';

export type Form = Record<string, any>;
export type FormSubmission = Record<string, any>;

export const formsService = {
  list: (params?: Record<string, unknown>) => unwrap<Paginated<Form>>(api.get('/forms', { params })),
  detail: (formId: number | string) => unwrap<Form>(api.get(`/forms/${formId}`)),
  submissions: (params?: Record<string, unknown>) => (
    unwrap<Paginated<FormSubmission>>(api.get('/forms/submissions', { params }))
  ),
  submissionDetail: (submissionId: number | string) => (
    unwrap<FormSubmission>(api.get(`/forms/submissions/${submissionId}`))
  ),
  updateSubmission: ({ submissionId, payload }: { submissionId: number | string; payload: Record<string, unknown> }) => (
    unwrap<FormSubmission>(api.patch(`/forms/submissions/${submissionId}`, payload))
  ),
  forwardSubmission: (submissionId: number | string) => (
    unwrap<{ submission: FormSubmission; destinationStatus: number }>(api.post(`/forms/submissions/${submissionId}/forward`))
  ),
  exportSubmissions: (params?: Record<string, unknown>) => (
    api.get('/forms/submissions/export', { params, responseType: 'blob' })
  ),
  create: (payload: Record<string, unknown>) => unwrap<Form>(api.post('/forms', payload)),
  update: ({ formId, payload }: { formId: number | string; payload: Record<string, unknown> }) => (
    unwrap<Form>(api.patch(`/forms/${formId}`, payload))
  ),
  remove: (formId: number | string) => unwrap(api.delete(`/forms/${formId}`)),
  createStep: ({ formId, payload }: { formId: number | string; payload: Record<string, unknown> }) => (
    unwrap<Form>(api.post(`/forms/${formId}/steps`, payload))
  ),
  updateStep: ({ formId, stepId, payload }: { formId: number | string; stepId: number | string; payload: Record<string, unknown> }) => (
    unwrap<Form>(api.patch(`/forms/${formId}/steps/${stepId}`, payload))
  ),
  deleteStep: ({ formId, stepId }: { formId: number | string; stepId: number | string }) => (
    unwrap(api.delete(`/forms/${formId}/steps/${stepId}`))
  ),
  reorderSteps: ({ formId, steps }: { formId: number | string; steps: Array<number | string> }) => (
    unwrap<Form>(api.patch(`/forms/${formId}/steps/reorder`, { steps }))
  ),
};
