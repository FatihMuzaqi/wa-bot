import ApiError from '../../utils/ApiError.js';
import SchedulerTimeService from './schedulerTime.service.js';

const validate = (schema) => (req, _res, next) => {
  try {
    schema(req);
    next();
  } catch (error) {
    next(error);
  }
};

const requiredString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(422, `${field} is required`);
  }
};

const requiredPositiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

const validateSchedulePayload = (body) => {
  requiredString(body.title, 'title');

  if (!body.messagePayload || typeof body.messagePayload !== 'object') {
    throw new ApiError(422, 'messagePayload is required');
  }

  if (body.frequency && !['once', 'daily', 'weekly', 'monthly', 'custom'].includes(body.frequency)) {
    throw new ApiError(422, 'frequency must be one of once, daily, weekly, monthly, custom');
  }

  if (body.frequency === 'custom' && !SchedulerTimeService.validateCronExpression(body.cronExpression)) {
    throw new ApiError(422, 'cronExpression is invalid');
  }

  if (body.startAt && Number.isNaN(new Date(body.startAt).getTime())) {
    throw new ApiError(422, 'startAt must be a valid date');
  }
};

export const validateCreateSchedule = validate(({ body }) => {
  validateSchedulePayload(body);
});

export const validateCreateReminder = validate(({ body }) => {
  validateSchedulePayload(body);
});

export const validateScheduleId = validate(({ params }) => {
  requiredPositiveInteger(params.scheduleId, 'scheduleId');
});

export const validateCampaignSchedule = validate(({ body }) => {
  requiredPositiveInteger(body.broadcastId, 'broadcastId');
  requiredString(body.scheduledAt, 'scheduledAt');
  if (Number.isNaN(new Date(body.scheduledAt).getTime())) {
    throw new ApiError(422, 'scheduledAt must be a valid date');
  }
});
