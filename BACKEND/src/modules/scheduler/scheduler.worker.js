import cron from 'node-cron';
import SchedulerService from './scheduler.service.js';
import BroadcastService from '../broadcast/broadcast.service.js';

let task = null;
let running = false;

export const tick = async () => {
  if (running) return [];
  running = true;

  try {
    const [scheduleRuns, broadcasts] = await Promise.all([
      SchedulerService.runDueSchedules(),
      BroadcastService.processDueBroadcasts(),
    ]);
    return { scheduleRuns, broadcasts };
  } finally {
    running = false;
  }
};

export const startSchedulerWorker = () => {
  if (task) return task;

  const expression = process.env.SCHEDULER_CRON_EXPRESSION || '*/1 * * * *';
  const timezone = process.env.SCHEDULER_TIMEZONE || 'Asia/Jakarta';

  if (!cron.validate(expression)) {
    throw new Error(`Invalid SCHEDULER_CRON_EXPRESSION: ${expression}`);
  }

  task = cron.schedule(expression, () => {
    tick().catch((error) => {
      console.error('Scheduler worker tick failed:', error);
    });
  }, {
    scheduled: true,
    timezone,
  });

  return task;
};

export const stopSchedulerWorker = () => {
  task?.stop();
  task = null;
};

export default {
  tick,
  startSchedulerWorker,
  stopSchedulerWorker,
};
