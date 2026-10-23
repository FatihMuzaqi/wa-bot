import { Op } from 'sequelize';
import models from '../../../database/models/index.js';

const { Schedule, ScheduleRun, Broadcast } = models;

export const createSchedule = (payload, options = {}) => Schedule.create(payload, options);

export const findScheduleById = (scheduleId) => Schedule.findByPk(scheduleId, {
  include: [
    { model: ScheduleRun, as: 'runs', separate: true, order: [['run_at', 'DESC']], limit: 20 },
  ],
});

export const findSchedules = ({ page = 1, limit = 20, status } = {}) => {
  const where = {};
  if (status) where.status = status;

  return Schedule.findAndCountAll({
    where,
    order: [['next_run_at', 'ASC'], ['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });
};

export const findDueSchedules = (now = new Date()) => Schedule.findAll({
  where: {
    status: 'active',
    next_run_at: { [Op.lte]: now },
  },
  order: [['next_run_at', 'ASC']],
  limit: 100,
});

export const updateSchedule = (schedule, payload, options = {}) => schedule.update(payload, options);

export const createRun = (payload, options = {}) => ScheduleRun.create(payload, options);

export const updateRun = (run, payload, options = {}) => run.update(payload, options);

export const findBroadcastById = (broadcastId) => Broadcast.findByPk(broadcastId);

export const findRunsBySchedule = (scheduleId) => ScheduleRun.findAll({
  where: { schedule_id: scheduleId },
  include: [{ model: Broadcast, as: 'broadcast' }],
  order: [['run_at', 'DESC'], ['id', 'DESC']],
});

export default {
  createSchedule,
  findScheduleById,
  findSchedules,
  findDueSchedules,
  updateSchedule,
  createRun,
  updateRun,
  findRunsBySchedule,
  findBroadcastById,
};
