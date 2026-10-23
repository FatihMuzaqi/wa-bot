export const SOCKET_EVENTS = Object.freeze({
  CHAT_NEW: 'chat:new',
  CHAT_UPDATE: 'chat:update',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_READ: 'message:read',
  AGENT_ONLINE: 'agent:online',
  AGENT_OFFLINE: 'agent:offline',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  NEW_MESSAGE: 'new-message',
  CHAT_UPDATED: 'chat-updated',
  CONTACT_UPDATED: 'contact-updated',
});

export const SOCKET_ROOMS = Object.freeze({
  user: (userId) => `user:${userId}`,
  role: (role) => `role:${role}`,
  chat: (chatId) => `chat:${chatId}`,
  agents: 'agents',
  admins: 'admins',
});

export default SOCKET_EVENTS;
