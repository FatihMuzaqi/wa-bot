import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import FormsController from './forms.controller.js';
import {
  validateCreateForm,
  validateCreateStep,
  validateDeleteStep,
  validateFormId,
  validateReorderSteps,
  validateSubmissionId,
  validateSubmissionList,
  validateUpdateSubmission,
  validateUpdateForm,
  validateUpdateStep,
} from './forms.validation.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', FormsController.list);
router.post('/', validateCreateForm, FormsController.create);
router.get('/submissions/export', validateSubmissionList, FormsController.exportSubmissions);
router.get('/submissions', validateSubmissionList, FormsController.listSubmissions);
router.get('/submissions/:submissionId', validateSubmissionId, FormsController.submissionDetail);
router.patch('/submissions/:submissionId', validateUpdateSubmission, FormsController.updateSubmission);
router.post('/submissions/:submissionId/forward', validateSubmissionId, FormsController.forwardSubmission);
router.get('/:formId', validateFormId, FormsController.detail);
router.patch('/:formId', validateUpdateForm, FormsController.update);
router.delete('/:formId', validateFormId, FormsController.remove);
router.post('/:formId/steps', validateCreateStep, FormsController.createStep);
router.patch('/:formId/steps/reorder', validateReorderSteps, FormsController.reorderSteps);
router.patch('/:formId/steps/:stepId', validateUpdateStep, FormsController.updateStep);
router.delete('/:formId/steps/:stepId', validateDeleteStep, FormsController.deleteStep);

export default router;
