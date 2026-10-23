import { col } from 'sequelize';
import models from '../../../database/models/index.js';

const { Message, User } = models;

export const createMessage = (payload, options = {}) => Message.create(payload, options);

export const updateMessage = (message, payload, options = {}) => message.update(payload, options);

export const findMessageById = (messageId) => Message.findByPk(messageId, {
  include: [{ model: User, as: 'senderUser', attributes: ['id', 'name', 'email'] }],
});

export const findMessagesByChatId = ({ chatId, page = 1, limit = 100 }) => Message.findAndCountAll({
  where: { chat_id: chatId },
  include: [{ model: User, as: 'senderUser', attributes: ['id', 'name', 'email'] }],
  order: [[col('Message.message_timestamp'), 'ASC'], [col('Message.id'), 'ASC']],
  limit,
  offset: (page - 1) * limit,
});

export default {
  createMessage,
  updateMessage,
  findMessageById,
  findMessagesByChatId,
};
