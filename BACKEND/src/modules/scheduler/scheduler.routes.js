import { Router } from 'express';
import SchedulerController from './scheduler.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  validateCampaignSchedule,
  validateCreateReminder,
  validateCreateSchedule,
  validateScheduleId,
} from './scheduler.validation.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', SchedulerController.listSchedules);
router.post('/', validateCreateSchedule, SchedulerController.createSchedule);
router.post('/reminders', validateCreateReminder, SchedulerController.createReminder);
router.post('/campaigns/schedule', validateCampaignSchedule, SchedulerController.scheduleCampaign);
router.post('/run-due', SchedulerController.runDueNow);
router.get('/:scheduleId', validateScheduleId, SchedulerController.getSchedule);
router.patch('/:scheduleId', validateScheduleId, SchedulerController.updateSchedule);
router.delete('/:scheduleId', validateScheduleId, SchedulerController.deleteSchedule);
router.post('/:scheduleId/pause', validateScheduleId, SchedulerController.pauseSchedule);
router.post('/:scheduleId/resume', validateScheduleId, SchedulerController.resumeSchedule);
router.post('/:scheduleId/run-now', validateScheduleId, SchedulerController.runScheduleNow);
router.get('/:scheduleId/runs', validateScheduleId, SchedulerController.getScheduleRuns);

export default router;
