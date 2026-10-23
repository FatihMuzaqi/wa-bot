import { Server } from 'socket.io';
import models from '../database/models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ROLES } from '../constants/roles.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/socketEvents.js';
import PresenceService from './presence.service.js';

const { User, Role } = models;

let io = null;
let chatNamespace = null;

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) throw new Error('Socket authentication token is required');

    const payload = AuthService.verifyAccessToken(token);
    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || user.status !== 'active') throw new Error('Socket user is not authorized');

    socket.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const configureRedisAdapter = async () => {
  if (!process.env.REDIS_URL) return;

  const [{ createAdapter }, { createClient }] = await Promise.all([
    import('@socket.io/redis-adapter'),
    import('redis'),
  ]);

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
};

export const initSocket = async (httpServer, options = {}) => {
  io = new Server(httpServer, {
    cors: {
      origin: options.origin || '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  await configureRedisAdapter();

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    socket.join(SOCKET_ROOMS.user(socket.user.id));
    socket.join(SOCKET_ROOMS.role(socket.user.role));

    if (socket.user.role === ROLES.AGENT) socket.join(SOCKET_ROOMS.agents);
    if (socket.user.role === ROLES.ADMIN) socket.join(SOCKET_ROOMS.admins);

    const { firstConnection } = PresenceService.addConnection(socket.user, socket.id);
    if (socket.user.role === ROLES.AGENT && firstConnection) {
      io.to(SOCKET_ROOMS.admins).emit(SOCKET_EVENTS.AGENT_ONLINE, {
        agent: socket.user,
        onlineAt: new Date(),
      });
    }

    socket.on('chat:join', ({ chatId }) => {
      if (chatId) socket.join(SOCKET_ROOMS.chat(chatId));
    });

    socket.on('chat:leave', ({ chatId }) => {
      if (chatId) socket.leave(SOCKET_ROOMS.chat(chatId));
    });

    socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId }) => {
      if (chatId) socket.to(SOCKET_ROOMS.chat(chatId)).emit(SOCKET_EVENTS.TYPING_START, {
        chatId,
        user: socket.user,
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId }) => {
      if (chatId) socket.to(SOCKET_ROOMS.chat(chatId)).emit(SOCKET_EVENTS.TYPING_STOP, {
        chatId,
        user: socket.user,
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ chatId, messageId }) => {
      if (chatId) socket.to(SOCKET_ROOMS.chat(chatId)).emit(SOCKET_EVENTS.MESSAGE_READ, {
        chatId,
        messageId,
        readBy: socket.user,
        readAt: new Date(),
      });
    });

    socket.on('disconnect', () => {
      const { lastConnection } = PresenceService.removeConnection(socket.user.id, socket.id);
      if (socket.user.role === ROLES.AGENT && lastConnection) {
        io.to(SOCKET_ROOMS.admins).emit(SOCKET_EVENTS.AGENT_OFFLINE, {
          agent: socket.user,
          offlineAt: new Date(),
        });
      }
    });
  });

  chatNamespace = io.of('/chat');
  chatNamespace.use(authenticateSocket);

  chatNamespace.on('connection', (socket) => {
    socket.join(SOCKET_ROOMS.user(socket.user.id));
    socket.join(SOCKET_ROOMS.role(socket.user.role));

    if (socket.user.role === ROLES.AGENT) socket.join(SOCKET_ROOMS.agents);
    if (socket.user.role === ROLES.ADMIN) socket.join(SOCKET_ROOMS.admins);

    socket.on('chat:join', ({ chatId }) => {
      if (chatId) socket.join(SOCKET_ROOMS.chat(chatId));
    });

    socket.on('chat:leave', ({ chatId }) => {
      if (chatId) socket.leave(SOCKET_ROOMS.chat(chatId));
    });

    socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId }) => {
      if (chatId) socket.to(SOCKET_ROOMS.chat(chatId)).emit(SOCKET_EVENTS.TYPING_START, {
        chatId,
        user: socket.user,
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId }) => {
      if (chatId) socket.to(SOCKET_ROOMS.chat(chatId)).emit(SOCKET_EVENTS.TYPING_STOP, {
        chatId,
        user: socket.user,
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ chatId, messageId }) => {
      if (chatId) socket.to(SOCKET_ROOMS.chat(chatId)).emit(SOCKET_EVENTS.MESSAGE_READ, {
        chatId,
        messageId,
        readBy: socket.user,
        readAt: new Date(),
      });
    });
  });

  return io;
};

export const getSocket = () => io;
export const getChatNamespace = () => chatNamespace;

export const emitToChat = (chatId, event, payload) => {
  io?.to(SOCKET_ROOMS.chat(chatId)).emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  io?.to(SOCKET_ROOMS.user(userId)).emit(event, payload);
};

export const emitToRole = (role, event, payload) => {
  io?.to(SOCKET_ROOMS.role(role)).emit(event, payload);
};

export const emitGlobal = (event, payload) => {
  io?.emit(event, payload);
};

export const emitChatNew = (chat) => {
  io?.to(SOCKET_ROOMS.admins).to(SOCKET_ROOMS.agents).emit(SOCKET_EVENTS.CHAT_NEW, { chat });
};

export const emitChatUpdate = (chatId, payload) => {
  emitToChat(chatId, SOCKET_EVENTS.CHAT_UPDATE, { chatId, ...payload });
  io?.to(SOCKET_ROOMS.admins).emit(SOCKET_EVENTS.CHAT_UPDATE, { chatId, ...payload });
};

export const emitMessageNew = (chatId, message) => {
  emitToChat(chatId, SOCKET_EVENTS.MESSAGE_NEW, { chatId, message });
};

export const emitMessageUpdate = (chatId, message) => {
  emitToChat(chatId, SOCKET_EVENTS.MESSAGE_UPDATE, { chatId, message });
};

export const emitMessageRead = (chatId, payload) => {
  emitToChat(chatId, SOCKET_EVENTS.MESSAGE_READ, { chatId, ...payload });
};

const emitToChatNamespaceRoom = (room, event, payload) => {
  chatNamespace?.to(room).emit(event, payload);
};

export const emitChatMessageSaved = ({ contact, chat, message, reason = 'message_saved' }) => {
  if (!chat || !message) return;

  const payload = {
    chatId: chat.id,
    contactId: contact?.id || chat.contact_id,
    message,
    chat,
    contact,
  };

  emitToChatNamespaceRoom(SOCKET_ROOMS.chat(chat.id), SOCKET_EVENTS.NEW_MESSAGE, payload);
  emitToChatNamespaceRoom(SOCKET_ROOMS.admins, SOCKET_EVENTS.NEW_MESSAGE, payload);
  emitToChatNamespaceRoom(SOCKET_ROOMS.agents, SOCKET_EVENTS.NEW_MESSAGE, payload);

  const chatPayload = {
    chatId: chat.id,
    chat,
    reason,
  };
  emitToChatNamespaceRoom(SOCKET_ROOMS.chat(chat.id), SOCKET_EVENTS.CHAT_UPDATED, chatPayload);
  emitToChatNamespaceRoom(SOCKET_ROOMS.admins, SOCKET_EVENTS.CHAT_UPDATED, chatPayload);
  emitToChatNamespaceRoom(SOCKET_ROOMS.agents, SOCKET_EVENTS.CHAT_UPDATED, chatPayload);

  if (contact) {
    const contactPayload = {
      contactId: contact.id,
      contact,
      reason,
    };
    emitToChatNamespaceRoom(SOCKET_ROOMS.chat(chat.id), SOCKET_EVENTS.CONTACT_UPDATED, contactPayload);
    emitToChatNamespaceRoom(SOCKET_ROOMS.admins, SOCKET_EVENTS.CONTACT_UPDATED, contactPayload);
    emitToChatNamespaceRoom(SOCKET_ROOMS.agents, SOCKET_EVENTS.CONTACT_UPDATED, contactPayload);
  }
};

export const emitWebhookMessageSaved = ({ contact, chat, message }) => (
  emitChatMessageSaved({ contact, chat, message, reason: 'messages_upsert_saved' })
);

export default {
  initSocket,
  getSocket,
  getChatNamespace,
  emitToChat,
  emitToUser,
  emitToRole,
  emitGlobal,
  emitChatNew,
  emitChatUpdate,
  emitMessageNew,
  emitMessageUpdate,
  emitMessageRead,
  emitChatMessageSaved,
  emitWebhookMessageSaved,
};
