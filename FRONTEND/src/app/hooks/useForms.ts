import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formsService } from '../services/forms.service';

export const useForms = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['forms', params],
  queryFn: () => formsService.list(params),
});

export const useFormDetail = (formId?: number | string | null) => useQuery({
  queryKey: ['forms', 'detail', formId],
  queryFn: () => formsService.detail(formId as number | string),
  enabled: Boolean(formId),
});

export const useFormSubmissions = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['form-submissions', params],
  queryFn: () => formsService.submissions(params),
});

export const useFormSubmissionDetail = (submissionId?: number | string | null) => useQuery({
  queryKey: ['form-submissions', 'detail', submissionId],
  queryFn: () => formsService.submissionDetail(submissionId as number | string),
  enabled: Boolean(submissionId),
});

export const useUpdateFormSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.updateSubmission,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['form-submissions', 'detail', variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
};

export const useForwardFormSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.forwardSubmission,
    onSuccess: (_data, submissionId) => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['form-submissions', 'detail', submissionId] });
    },
  });
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forms'] }),
  });
};

export const useUpdateForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.update,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', 'detail', variables.formId] });
    },
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forms'] }),
  });
};

export const useCreateFormStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.createStep,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', 'detail', variables.formId] });
    },
  });
};

export const useUpdateFormStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.updateStep,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', 'detail', variables.formId] });
    },
  });
};

export const useDeleteFormStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.deleteStep,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', 'detail', variables.formId] });
    },
  });
};

export const useReorderFormSteps = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsService.reorderSteps,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', 'detail', variables.formId] });
    },
  });
};
