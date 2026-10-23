const state = {
  queue: [],
  processing: new Set(),
  completed: 0,
  failed: 0,
  concurrency: Number(process.env.BROADCAST_QUEUE_CONCURRENCY || 2),
  running: false,
  handler: null,
};

const processNext = () => {
  if (!state.handler || state.running) return;
  state.running = true;

  setImmediate(() => {
    try {
      while (state.processing.size < state.concurrency && state.queue.length > 0) {
        const job = state.queue.shift();
        state.processing.add(job.key);

        state.handler(job.payload)
          .then(() => {
            state.completed += 1;
          })
          .catch(() => {
            state.failed += 1;
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

export const registerHandler = (handler) => {
  state.handler = handler;
};

export const enqueueRecipient = ({ broadcastId, recipientId, attempt = 1, delayMs = 0 }) => {
  const key = `${broadcastId}:${recipientId}:${attempt}`;

  const addJob = () => {
    state.queue.push({
      key,
      payload: { broadcastId, recipientId, attempt },
      createdAt: new Date(),
    });
    processNext();
  };

  if (delayMs > 0) {
    setTimeout(addJob, delayMs);
  } else {
    addJob();
  }

  return { queued: true, key };
};

export const getStatus = () => ({
  queued: state.queue.length,
  processing: state.processing.size,
  completed: state.completed,
  failed: state.failed,
  concurrency: state.concurrency,
});

export default {
  registerHandler,
  enqueueRecipient,
  getStatus,
};
