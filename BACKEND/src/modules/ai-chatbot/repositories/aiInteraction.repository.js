import models from '../../../database/models/index.js';

const { AiInteraction } = models;

export const createInteraction = (payload, options = {}) => AiInteraction.create(payload, options);

export const findByChatId = (chatId, { limit = 50 } = {}) => AiInteraction.findAll({
  where: { chat_id: chatId },
  order: [['created_at', 'DESC']],
  limit,
});

export default {
  createInteraction,
  findByChatId,
};
