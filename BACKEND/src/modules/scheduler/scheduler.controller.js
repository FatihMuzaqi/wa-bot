import SchedulerService from './scheduler.service.js';
import SchedulerWorker from './scheduler.worker.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

export const listSchedules = asyncHandler(async (req, res) => {
  const data = await SchedulerService.listSchedules(req.query);
  return successResponse(res, data, 'Schedules loaded');
});

export const getSchedule = asyncHandler(async (req, res) => {
  const data = await SchedulerService.getSchedule(req.params.scheduleId);
  return successResponse(res, data, 'Schedule loaded');
});

export const createSchedule = asyncHandler(async (req, res) => {
  const data = await SchedulerService.createSchedule(req.user, req.body);
  return successResponse(res, data, 'Schedule created', 201);
});

export const createReminder = asyncHandler(async (req, res) => {
  const data = await SchedulerService.createReminder(req.user, req.body);
  return successResponse(res, data, 'Reminder created', 201);
});

export const pauseSchedule = asyncHandler(async (req, res) => {
  const data = await SchedulerService.pauseSchedule(req.params.scheduleId);
  return successResponse(res, data, 'Schedule paused');
});

export const resumeSchedule = asyncHandler(async (req, res) => {
  const data = await SchedulerService.resumeSchedule(req.params.scheduleId);
  return successResponse(res, data, 'Schedule resumed');
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const data = await SchedulerService.updateSchedule(req.params.scheduleId, req.body);
  return successResponse(res, data, 'Schedule updated');
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const data = await SchedulerService.deleteSchedule(req.params.scheduleId);
  return successResponse(res, data, 'Schedule deleted');
});

export const runScheduleNow = asyncHandler(async (req, res) => {
  const data = await SchedulerService.runScheduleNow(req.params.scheduleId);
  return successResponse(res, data, 'Schedule run started', 202);
});

export const getScheduleRuns = asyncHandler(async (req, res) => {
  const data = await SchedulerService.getScheduleRuns(req.params.scheduleId);
  return successResponse(res, data, 'Schedule runs loaded');
});

export const scheduleCampaign = asyncHandler(async (req, res) => {
  const data = await SchedulerService.scheduleCampaign(req.body);
  return successResponse(res, data, 'Campaign scheduled');
});

export const runDueNow = asyncHandler(async (_req, res) => {
  const data = await SchedulerWorker.tick();
  return successResponse(res, data, 'Scheduler tick executed');
});

export default {
  listSchedules,
  getSchedule,
  createSchedule,
  createReminder,
  pauseSchedule,
  resumeSchedule,
  updateSchedule,
  deleteSchedule,
  runScheduleNow,
  getScheduleRuns,
  scheduleCampaign,
  runDueNow,
};
