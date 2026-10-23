import { Op } from 'sequelize';
import models from '../../../database/models/index.js';

const { BotRuleLog, Chat, Contact, Form, FormAnswer, FormStep, FormSubmission, Message } = models;

export const findChatContext = (chatId) => Chat.findByPk(chatId, {
  include: [{ model: Contact, as: 'contact' }],
});

export const findMessage = (messageId) => Message.findByPk(messageId);

export const findRecentConversation = async ({ chatId, excludeMessageId = null, limit = 10 }) => {
  const where = { chat_id: chatId };
  if (excludeMessageId) {
    where.id = { [Op.ne]: excludeMessageId };
  }

  const messages = await Message.findAll({
    where,
    attributes: ['id', 'sender_type', 'direction', 'message_type', 'content', 'created_at', 'message_timestamp'],
    order: [['created_at', 'DESC']],
    limit,
  });

  return messages.reverse().map((message) => ({
    id: message.id,
    role: message.sender_type === 'contact' || message.direction === 'inbound' ? 'user' : 'assistant',
    senderType: message.sender_type,
    direction: message.direction,
    messageType: message.message_type,
    content: message.content || `[${message.message_type} message]`,
    timestamp: message.message_timestamp || message.created_at,
  }));
};

export const countChatMessages = (chatId) => Message.count({
  where: { chat_id: chatId },
});

export const findActiveForm = (formId) => Form.findOne({
  where: {
    id: formId,
    status: 'active',
  },
});

export const findFirstFormStep = (formId) => FormStep.findOne({
  where: { form_id: formId },
  order: [['step_order', 'ASC'], ['id', 'ASC']],
});

export const createFormSubmission = (payload, options = {}) => FormSubmission.create(payload, options);

export const findActiveFormSubmission = (chatId) => FormSubmission.findOne({
  where: {
    chat_id: chatId,
    status: 'in_progress',
  },
  order: [['started_at', 'DESC'], ['id', 'DESC']],
  include: [{ model: Form, as: 'form' }],
});

export const findFormStep = (stepId) => FormStep.findByPk(stepId);

export const findNextFormStep = ({ formId, currentOrder }) => FormStep.findOne({
  where: {
    form_id: formId,
    step_order: { [Op.gt]: currentOrder },
  },
  order: [['step_order', 'ASC'], ['id', 'ASC']],
});

export const upsertFormAnswer = async (payload, options = {}) => {
  const [answer, created] = await FormAnswer.findOrCreate({
    where: {
      form_submission_id: payload.form_submission_id,
      form_step_id: payload.form_step_id,
    },
    defaults: payload,
    ...options,
  });

  if (!created) {
    await answer.update({
      answer: payload.answer,
      answer_json: payload.answer_json,
    }, options);
  }

  return answer;
};

export const updateFormSubmission = (submission, payload, options = {}) => submission.update(payload, options);

export const createMessage = (payload, options = {}) => Message.create(payload, options);

export const updateMessage = (message, payload, options = {}) => message.update(payload, options);

export const updateChat = (chat, payload, options = {}) => chat.update(payload, options);

export const createLog = (payload, options = {}) => BotRuleLog.create(payload, options);

export default {
  findChatContext,
  findMessage,
  findRecentConversation,
  countChatMessages,
  findActiveForm,
  findFirstFormStep,
  createFormSubmission,
  findActiveFormSubmission,
  findFormStep,
  findNextFormStep,
  upsertFormAnswer,
  updateFormSubmission,
  createMessage,
  updateMessage,
  updateChat,
  createLog,
};
