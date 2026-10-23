import { col, Op } from 'sequelize';
import models from '../../../database/models/index.js';

const { Chat, Contact, User, Message } = models;

const chatIncludes = [
  { model: Contact, as: 'contact' },
  { model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email', 'status'] },
];

export const findChats = async ({ page = 1, limit = 20, status, assignedAgentId, search } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (assignedAgentId) where.assigned_agent_id = assignedAgentId;

  const contactWhere = search
    ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    }
    : undefined;

  const result = await Chat.findAndCountAll({
    where,
    include: [
      { model: Contact, as: 'contact', where: contactWhere },
      { model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email', 'status'] },
    ],
    order: [[col('Chat.last_message_at'), 'DESC'], [col('Chat.id'), 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  const chatIds = result.rows.map((chat) => chat.id);
  if (!chatIds.length) return result;

  const lastMessages = await Message.findAll({
    where: { chat_id: { [Op.in]: chatIds } },
    include: [{ model: User, as: 'senderUser', attributes: ['id', 'name', 'email'] }],
    order: [[col('Message.chat_id'), 'ASC'], [col('Message.message_timestamp'), 'DESC'], [col('Message.id'), 'DESC']],
  });

  const lastMessageByChatId = new Map();
  lastMessages.forEach((message) => {
    const chatId = String(message.chat_id);
    if (!lastMessageByChatId.has(chatId)) {
      lastMessageByChatId.set(chatId, message);
    }
  });

  result.rows.forEach((chat) => {
    chat.setDataValue('lastMessage', lastMessageByChatId.get(String(chat.id)) || null);
  });

  return result;
};

export const findChatById = (chatId) => Chat.findByPk(chatId, {
  include: [
    ...chatIncludes,
    {
      model: Message,
      as: 'messages',
      separate: true,
      order: [[col('Message.message_timestamp'), 'ASC'], [col('Message.id'), 'ASC']],
      limit: 100,
      include: [{ model: User, as: 'senderUser', attributes: ['id', 'name', 'email'] }],
    },
  ],
});

export const findActiveChatByContactId = (contactId, options = {}) => Chat.findOne({
  where: {
    contact_id: contactId,
    status: { [Op.ne]: 'closed' },
  },
  order: [[col('Chat.last_message_at'), 'DESC'], [col('Chat.id'), 'DESC']],
  ...options,
});

export const createChat = (payload, options = {}) => Chat.create(payload, options);

export const updateChat = (chat, payload, options = {}) => chat.update(payload, options);

export const touchChatAfterMessage = (chatId, payload = {}, options = {}) => Chat.update({
  last_message_at: new Date(),
  ...payload,
}, {
  where: { id: chatId },
  ...options,
});

export const markChatAsRead = (chat, options = {}) => chat.update({
  unread_count: 0,
}, options);

export default {
  findChats,
  findChatById,
  findActiveChatByContactId,
  createChat,
  updateChat,
  touchChatAfterMessage,
  markChatAsRead,
};
