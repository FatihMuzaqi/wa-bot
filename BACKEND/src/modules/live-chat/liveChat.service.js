import { sequelize } from "../../database/models/index.js";
import { ROLES } from "../../constants/roles.js";
import ApiError from "../../utils/ApiError.js";
import EvolutionService from "../../integrations/evolution/evolution.service.js";
import SocketService from "../../sockets/socket.service.js";
import ChatRepository from "./repositories/chat.repository.js";
import MessageRepository from "./repositories/message.repository.js";
import UserRepository from "./repositories/user.repository.js";
import ChatAssignmentRepository from "./repositories/chatAssignment.repository.js";

const canAccessChat = (user, chat) => {
  if (user.role === ROLES.ADMIN) return true;
  if (chat.assigned_agent_id === user.id) return true;
  if (chat.status === "pending") return true;
  return false;
};

const assertChatAccess = (user, chat) => {
  if (!chat) throw new ApiError(404, "Chat not found");
  if (!canAccessChat(user, chat))
    throw new ApiError(403, "You cannot access this chat");
};

const serializePagination = ({ rows, count }, { page, limit }) => ({
  rows,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  },
});

const extractEvolutionMessageId = (response) =>
  response?.key?.id ||
  response?.message?.key?.id ||
  response?.data?.key?.id ||
  response?.id ||
  null;

export const getChatList = async (user, filters = {}) => {
  const page = Math.max(Number(filters.page || 1), 1);
  const limit = Math.min(Math.max(Number(filters.limit || 20), 1), 100);

  const query = {
    page,
    limit,
    status: filters.status,
    search: filters.search,
  };

  if (user.role === ROLES.AGENT && filters.scope === "pending") {
    query.status = "pending";
  }

  if (user.role === ROLES.AGENT && filters.scope !== "pending") {
    query.assignedAgentId = user.id;
  }

  const result = await ChatRepository.findChats(query);
  return serializePagination(result, { page, limit });
};

export const getChatDetail = async (user, chatId) => {
  const chat = await ChatRepository.findChatById(chatId);
  assertChatAccess(user, chat);
  return chat;
};

export const getChatMessages = async (user, chatId, filters = {}) => {
  const chat = await ChatRepository.findChatById(chatId);
  assertChatAccess(user, chat);

  const page = Math.max(Number(filters.page || 1), 1);
  const limit = Math.min(Math.max(Number(filters.limit || 100), 1), 200);
  const result = await MessageRepository.findMessagesByChatId({
    chatId,
    page,
    limit,
  });

  return serializePagination(result, { page, limit });
};

export const sendMessage = async (user, chatId, payload) => {
  const chat = await ChatRepository.findChatById(chatId);
  assertChatAccess(user, chat);
  console.log("SERVICE SEND MESSAGE START:", { user, chatId, body: payload });

  if (chat.status === "closed")
    throw new ApiError(409, "Cannot send message to a closed chat");
  if (!chat.contact?.phone)
    throw new ApiError(422, "Chat contact phone number is missing");

  const message = await MessageRepository.createMessage({
    chat_id: chat.id,
    contact_id: chat.contact_id,
    sender_user_id: user.id,
    sender_type: "agent",
    direction: "outbound",
    message_type: "text",
    content: payload.text,
    status: "queued",
    metadata: {
      source: "live_chat",
    },
  });

  try {
    const instanceName =
      payload.instanceName ||
      chat.instance_name ||
      process.env.EVOLUTION_INSTANCE_NAME ||
      process.env.EVOLUTION_INSTANCE;

    if (!instanceName) {
      throw new ApiError(422, "Evolution instance name is missing");
    }

    const evolutionResponse = await EvolutionService.sendText({
      instanceName: instanceName,
      number: chat.contact.phone,
      text: payload.text,
    });

    await MessageRepository.updateMessage(message, {
      status: "sent",
      evolution_message_id: extractEvolutionMessageId(evolutionResponse),
      metadata: {
        source: "live_chat",
        evolutionResponse,
      },
    });
  } catch (error) {
    await MessageRepository.updateMessage(message, {
      status: "failed",
      error_message: error.message,
    });
    throw error;
  }

  await ChatRepository.touchChatAfterMessage(chat.id, {
    status: "open",
    unread_count: 0,
  });

  const savedMessage = await MessageRepository.findMessageById(message.id);
  const updatedChat = await ChatRepository.findChatById(chat.id);

  SocketService.emitMessageNew(chat.id, savedMessage);
  SocketService.emitChatUpdate(chat.id, { reason: "message_sent" });
  SocketService.emitChatMessageSaved({
    contact: updatedChat.contact,
    chat: updatedChat,
    message: savedMessage,
    reason: "agent_message_sent",
  });
  if (chat.assigned_agent_id) {
    SocketService.emitToUser(chat.assigned_agent_id, "chat:update", {
      chatId: chat.id,
      reason: "message_sent",
    });
  }

  return savedMessage;
};

export const markChatAsRead = async (user, chatId) => {
  const chat = await ChatRepository.findChatById(chatId);
  assertChatAccess(user, chat);

  const updatedChat = await ChatRepository.markChatAsRead(chat);

  SocketService.emitChatUpdate(chat.id, {
    chat: updatedChat,
    reason: "chat_read",
  });
  SocketService.emitChatMessageSaved({
    contact: chat.contact,
    chat: updatedChat,
    message: null,
    reason: "chat_read",
  });

  return updatedChat;
};

export const assignAgent = async (user, chatId, agentId) => {
  if (user.role !== ROLES.ADMIN)
    throw new ApiError(403, "Only admin can assign agents");

  const [chat, agent] = await Promise.all([
    ChatRepository.findChatById(chatId),
    UserRepository.findAgentById(agentId),
  ]);

  if (!chat) throw new ApiError(404, "Chat not found");
  if (!agent) throw new ApiError(404, "Agent not found or inactive");

  await sequelize.transaction(async (transaction) => {
    await ChatAssignmentRepository.releaseActiveAssignments(chat.id, {
      transaction,
    });
    await ChatAssignmentRepository.createAssignment(
      {
        chat_id: chat.id,
        assigned_to_user_id: agent.id,
        assigned_by_user_id: user.id,
        status: "active",
        assigned_at: new Date(),
      },
      { transaction },
    );

    await ChatRepository.updateChat(
      chat,
      {
        assigned_agent_id: agent.id,
        status: "open",
      },
      { transaction },
    );
  });

  const updatedChat = await ChatRepository.findChatById(chat.id);

  SocketService.emitChatUpdate(chat.id, {
    chat: updatedChat,
    reason: "agent_assigned",
  });
  SocketService.emitToUser(agent.id, "chat:update", {
    chat: updatedChat,
    reason: "agent_assigned",
  });

  return updatedChat;
};

export const takeOver = async (user, chatId) => {
  const chat = await ChatRepository.findChatById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (user.role !== ROLES.ADMIN && chat.status === "closed")
    throw new ApiError(409, "Cannot take over a closed chat");

  await sequelize.transaction(async (transaction) => {
    await ChatAssignmentRepository.releaseActiveAssignments(chat.id, {
      transaction,
    });
    await ChatAssignmentRepository.createAssignment(
      {
        chat_id: chat.id,
        assigned_to_user_id: user.id,
        assigned_by_user_id: user.id,
        status: "active",
        assigned_at: new Date(),
      },
      { transaction },
    );

    await ChatRepository.updateChat(
      chat,
      {
        assigned_agent_id: user.id,
        status: "open",
        ai_enabled: false,
      },
      { transaction },
    );
  });

  const updatedChat = await ChatRepository.findChatById(chat.id);

  SocketService.emitChatUpdate(chat.id, {
    chat: updatedChat,
    reason: "chat_taken_over",
  });
  SocketService.emitToUser(user.id, "chat:update", {
    chat: updatedChat,
    reason: "chat_taken_over",
  });

  return updatedChat;
};

export const transferChat = async (user, chatId, agentId, note = null) => {
  const [chat, agent] = await Promise.all([
    ChatRepository.findChatById(chatId),
    UserRepository.findAgentById(agentId),
  ]);

  assertChatAccess(user, chat);
  if (chat.status === "closed")
    throw new ApiError(409, "Cannot transfer a closed chat");
  if (!agent) throw new ApiError(404, "Target agent not found or inactive");
  if (Number(chat.assigned_agent_id) === Number(agent.id)) {
    throw new ApiError(409, "Chat is already assigned to this agent");
  }

  await sequelize.transaction(async (transaction) => {
    await ChatAssignmentRepository.releaseActiveAssignments(chat.id, {
      transaction,
    });
    await ChatAssignmentRepository.createAssignment(
      {
        chat_id: chat.id,
        assigned_to_user_id: agent.id,
        assigned_by_user_id: user.id,
        status: "active",
        note,
        assigned_at: new Date(),
      },
      { transaction },
    );

    await ChatRepository.updateChat(
      chat,
      {
        assigned_agent_id: agent.id,
        status: "open",
        ai_enabled: false,
      },
      { transaction },
    );
  });

  const updatedChat = await ChatRepository.findChatById(chat.id);

  SocketService.emitChatUpdate(chat.id, {
    chat: updatedChat,
    reason: "chat_transferred",
  });
  SocketService.emitToUser(agent.id, "chat:update", {
    chat: updatedChat,
    reason: "chat_transferred",
  });
  SocketService.emitToRole(ROLES.ADMIN, "chat:update", {
    chat: updatedChat,
    reason: "chat_transferred",
  });

  return updatedChat;
};

export const closeChat = async (user, chatId) => {
  const chat = await ChatRepository.findChatById(chatId);
  assertChatAccess(user, chat);

  const updatedChat = await ChatRepository.updateChat(chat, {
    status: "closed",
    closed_at: new Date(),
    unread_count: 0,
  });

  SocketService.emitChatUpdate(chat.id, {
    chat: updatedChat,
    reason: "chat_closed",
  });
  if (chat.assigned_agent_id) {
    SocketService.emitToUser(chat.assigned_agent_id, "chat:update", {
      chat: updatedChat,
      reason: "chat_closed",
    });
  }

  return updatedChat;
};

export const LiveChatService = {
  getChatList,
  getChatDetail,
  getChatMessages,
  sendMessage,
  markChatAsRead,
  assignAgent,
  takeOver,
  transferChat,
  closeChat,
};

export default LiveChatService;
