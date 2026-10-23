import cron from 'node-cron';

const addDays = (date, amount) => new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

export const validateCronExpression = (expression) => cron.validate(expression);

export const computeInitialRunAt = ({ startAt, frequency, cronExpression }) => {
  if (startAt) return new Date(startAt);
  if (frequency === 'custom' && cronExpression) return new Date(Date.now() + 60 * 1000);
  return new Date();
};

export const computeNextRunAt = (schedule, from = new Date()) => {
  if (schedule.frequency === 'once') return null;
  if (schedule.frequency === 'daily') return addDays(from, 1);
  if (schedule.frequency === 'weekly') return addDays(from, 7);
  if (schedule.frequency === 'monthly') return addMonths(from, 1);

  if (schedule.frequency === 'custom') {
    if (!schedule.cron_expression || !cron.validate(schedule.cron_expression)) return null;
    return addDays(from, 1 / 1440);
  }

  return null;
};

export default {
  validateCronExpression,
  computeInitialRunAt,
  computeNextRunAt,
};
