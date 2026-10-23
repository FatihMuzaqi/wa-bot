import FormsService from './forms.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

export const list = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.list(req.query), 'Forms loaded')
));

export const detail = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.detail(req.params.formId), 'Form loaded')
));

export const listSubmissions = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.listSubmissions(req.query), 'Form submissions loaded')
));

export const submissionDetail = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.submissionDetail(req.params.submissionId), 'Form submission loaded')
));

export const updateSubmission = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.updateSubmission(req.params.submissionId, req.body), 'Form submission updated')
));

export const forwardSubmission = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.forwardSubmission(req.params.submissionId), 'Form submission forwarded')
));

export const exportSubmissions = asyncHandler(async (req, res) => {
  const result = await FormsService.exportSubmissions(req.query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  return res.status(200).send(`\uFEFF${result.content}`);
});

export const create = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.create(req.user, req.body), 'Form created', 201)
));

export const update = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.update(req.params.formId, req.body), 'Form updated')
));

export const remove = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.remove(req.params.formId), 'Form deleted')
));

export const createStep = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.createStep(req.params.formId, req.body), 'Form step created', 201)
));

export const updateStep = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.updateStep(req.params.formId, req.params.stepId, req.body), 'Form step updated')
));

export const deleteStep = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.deleteStep(req.params.formId, req.params.stepId), 'Form step deleted')
));

export const reorderSteps = asyncHandler(async (req, res) => (
  successResponse(res, await FormsService.reorderSteps(req.params.formId, req.body), 'Form steps reordered')
));

export default {
  list,
  detail,
  listSubmissions,
  submissionDetail,
  updateSubmission,
  forwardSubmission,
  exportSubmissions,
  create,
  update,
  remove,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
};
