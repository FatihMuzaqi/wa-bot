import ApiError from '../../utils/ApiError.js';
import BroadcastService from '../broadcast/broadcast.service.js';
import SchedulerRepository from './repositories/scheduler.repository.js';
import SchedulerTimeService from './schedulerTime.service.js';

const serializePagination = ({ rows, count }, { page, limit }) => ({
  rows,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  },
});

export const listSchedules = async (filters = {}) => {
  const page = Math.max(Number(filters.page || 1), 1);
  const limit = Math.min(Math.max(Number(filters.limit || 20), 1), 100);
  const result = await SchedulerRepository.findSchedules({
    page,
    limit,
    status: filters.status,
  });
  return serializePagination(result, { page, limit });
};

export const getSchedule = async (scheduleId) => {
  const schedule = await SchedulerRepository.findScheduleById(scheduleId);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  return schedule;
};

export const createSchedule = async (user, payload) => {
  if (payload.frequency === 'custom' && !SchedulerTimeService.validateCronExpression(payload.cronExpression)) {
    throw new ApiError(422, 'cronExpression is invalid');
  }

  const nextRunAt = SchedulerTimeService.computeInitialRunAt({
    startAt: payload.startAt,
    frequency: payload.frequency || 'once',
    cronExpression: payload.cronExpression,
  });

  return SchedulerRepository.createSchedule({
    title: payload.title,
    message_payload: payload.messagePayload,
    audience_filter: payload.audienceFilter || {},
    frequency: payload.frequency || 'once',
    cron_expression: payload.cronExpression || null,
    timezone: payload.timezone || process.env.SCHEDULER_TIMEZONE || 'Asia/Jakarta',
    next_run_at: nextRunAt,
    status: payload.status || 'active',
    created_by: user.id,
    metadata: {
      type: payload.type || 'recurring_message',
      reminder: payload.reminder || null,
    },
  });
};

export const createReminder = async (user, payload) => createSchedule(user, {
  ...payload,
  type: 'reminder',
  frequency: payload.frequency || 'once',
});

export const pauseSchedule = async (scheduleId) => {
  const schedule = await getSchedule(scheduleId);
  if (schedule.status === 'completed') throw new ApiError(409, 'Completed schedule cannot be paused');
  return SchedulerRepository.updateSchedule(schedule, { status: 'paused' });
};

export const resumeSchedule = async (scheduleId) => {
  const schedule = await getSchedule(scheduleId);
  if (schedule.status === 'completed') throw new ApiError(409, 'Completed schedule cannot be resumed');

  const nextRunAt = schedule.next_run_at && new Date(schedule.next_run_at) > new Date()
    ? schedule.next_run_at
    : SchedulerTimeService.computeInitialRunAt({
      startAt: null,
      frequency: schedule.frequency,
      cronExpression: schedule.cron_expression,
    });

  return SchedulerRepository.updateSchedule(schedule, {
    status: 'active',
    next_run_at: nextRunAt,
  });
};

export const updateSchedule = async (scheduleId, payload) => {
  const schedule = await getSchedule(scheduleId);
  const nextRunAt = payload.startAt || payload.nextRunAt
    ? new Date(payload.startAt || payload.nextRunAt)
    : schedule.next_run_at;

  if ((payload.frequency || schedule.frequency) === 'custom' && payload.cronExpression && !SchedulerTimeService.validateCronExpression(payload.cronExpression)) {
    throw new ApiError(422, 'cronExpression is invalid');
  }

  return SchedulerRepository.updateSchedule(schedule, {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.messagePayload !== undefined && { message_payload: payload.messagePayload }),
    ...(payload.audienceFilter !== undefined && { audience_filter: payload.audienceFilter }),
    ...(payload.frequency !== undefined && { frequency: payload.frequency }),
    ...(payload.cronExpression !== undefined && { cron_expression: payload.cronExpression || null }),
    ...(payload.timezone !== undefined && { timezone: payload.timezone }),
    ...(payload.status !== undefined && { status: payload.status }),
    next_run_at: nextRunAt,
  });
};

export const deleteSchedule = async (scheduleId) => {
  const schedule = await getSchedule(scheduleId);
  await schedule.destroy();
  return { id: Number(scheduleId) };
};

export const runScheduleNow = async (scheduleId) => {
  const schedule = await getSchedule(scheduleId);
  if (schedule.status === 'paused') throw new ApiError(409, 'Paused schedule cannot run');
  return executeSchedule(schedule);
};

export const getScheduleRuns = async (scheduleId) => {
  await getSchedule(scheduleId);
  return SchedulerRepository.findRunsBySchedule(scheduleId);
};

export const scheduleCampaign = async ({ broadcastId, scheduledAt }) => BroadcastService.scheduleCampaign(broadcastId, scheduledAt);

export const executeSchedule = async (schedule) => {
  const run = await SchedulerRepository.createRun({
    schedule_id: schedule.id,
    status: 'running',
    run_at: new Date(),
  });

  try {
    const broadcast = await BroadcastService.createCampaign(
      { id: schedule.created_by },
      {
        name: `${schedule.title} - ${new Date().toISOString()}`,
        messageType: schedule.message_payload?.media ? 'media' : 'text',
        messagePayload: schedule.message_payload,
        audienceFilter: schedule.audience_filter,
      },
    );

    const queued = await BroadcastService.startCampaign(broadcast.id);
    const nextRunAt = SchedulerTimeService.computeNextRunAt(schedule, new Date());

    await SchedulerRepository.updateSchedule(schedule, {
      last_run_at: new Date(),
      next_run_at: nextRunAt,
      status: nextRunAt ? 'active' : 'completed',
    });

    await SchedulerRepository.updateRun(run, {
      status: 'success',
      broadcast_id: broadcast.id,
      metadata: {
        queued,
      },
    });

    return run.reload();
  } catch (error) {
    await SchedulerRepository.updateRun(run, {
      status: 'failed',
      error_message: error.message,
    });

    await SchedulerRepository.updateSchedule(schedule, {
      status: 'failed',
      last_run_at: new Date(),
    });

    throw error;
  }
};

export const runDueSchedules = async () => {
  const dueSchedules = await SchedulerRepository.findDueSchedules();
  const results = [];

  for (const schedule of dueSchedules) {
    try {
      const result = await executeSchedule(schedule);
      results.push({ scheduleId: schedule.id, status: 'success', runId: result.id });
    } catch (error) {
      results.push({ scheduleId: schedule.id, status: 'failed', error: error.message });
    }
  }

  return results;
};

export const processDueSchedules = runDueSchedules;

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
  executeSchedule,
  runDueSchedules,
  processDueSchedules,
};
