import BroadcastRepository from './repositories/broadcast.repository.js';
import BroadcastService from './broadcast.service.js';

let timer = null;
let running = false;

export const tick = async () => {
  if (running) return;
  running = true;

  try {
    const dueBroadcasts = await BroadcastRepository.findDueScheduledBroadcasts();
    await Promise.all(dueBroadcasts.map((broadcast) => BroadcastService.startCampaign(broadcast.id)));
  } finally {
    running = false;
  }
};

export const startBroadcastScheduler = () => {
  if (timer) return timer;

  const intervalMs = Number(process.env.BROADCAST_SCHEDULER_INTERVAL_MS || 60000);
  timer = setInterval(() => {
    tick().catch((error) => {
      console.error('Broadcast scheduler tick failed:', error);
    });
  }, intervalMs);
  timer.unref?.();

  return timer;
};

export const stopBroadcastScheduler = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

export default {
  tick,
  startBroadcastScheduler,
  stopBroadcastScheduler,
};
