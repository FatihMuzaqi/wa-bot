import BotExecutionService from './botExecution.service.js';

const state = {
  queue: [],
  processing: new Set(),
  completed: 0,
  failed: 0,
  concurrency: Number(process.env.BOT_ENGINE_CONCURRENCY || 3),
  running: false,
};

const jobKey = (payload) => `${payload.chatId}:${payload.messageId || payload.text || Date.now()}`;

const processNext = () => {
  if (state.running) return;
  state.running = true;

  setImmediate(async () => {
    try {
      while (state.processing.size < state.concurrency && state.queue.length > 0) {
        const job = state.queue.shift();
        state.processing.add(job.key);

        BotExecutionService.execute(job.payload)
          .then((result) => {
            state.completed += 1;
            job.resolve(result);
          })
          .catch((error) => {
            state.failed += 1;
            job.reject(error);
          })
          .finally(() => {
            state.processing.delete(job.key);
            processNext();
          });
      }
    } finally {
      state.running = false;
      if (state.queue.length > 0 && state.processing.size < state.concurrency) {
        processNext();
      }
    }
  });
};

export const enqueue = (payload, { wait = false } = {}) => {
  const key = jobKey(payload);
  const duplicateQueued = state.queue.some((job) => job.key === key);
  const duplicateProcessing = state.processing.has(key);

  if (duplicateQueued || duplicateProcessing) {
    const result = {
      queued: false,
      duplicate: true,
      key,
    };
    return wait ? Promise.resolve(result) : result;
  }

  if (!wait) {
    state.queue.push({
      key,
      payload,
      resolve: () => {},
      reject: () => {},
      createdAt: new Date(),
    });
    processNext();
    return {
      queued: true,
      duplicate: false,
      key,
    };
  }

  return new Promise((resolve, reject) => {
    state.queue.push({
      key,
      payload,
      resolve,
      reject,
      createdAt: new Date(),
    });
    processNext();
  });
};

export const getStatus = () => ({
  queued: state.queue.length,
  processing: state.processing.size,
  completed: state.completed,
  failed: state.failed,
  concurrency: state.concurrency,
});

export default {
  enqueue,
  getStatus,
};
