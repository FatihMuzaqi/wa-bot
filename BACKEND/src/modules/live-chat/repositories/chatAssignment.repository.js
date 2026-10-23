import models from '../../../database/models/index.js';

const { ChatAssignment } = models;

export const releaseActiveAssignments = (chatId, options = {}) => ChatAssignment.update({
  status: 'released',
  released_at: new Date(),
}, {
  where: {
    chat_id: chatId,
    status: 'active',
  },
  ...options,
});

export const createAssignment = (payload, options = {}) => ChatAssignment.create(payload, options);

export default {
  releaseActiveAssignments,
  createAssignment,
};
