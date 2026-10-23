const onlineUsers = new Map();

export const addConnection = (user, socketId) => {
  const key = String(user.id);
  const existing = onlineUsers.get(key) || {
    user,
    sockets: new Set(),
    onlineAt: new Date(),
  };

  existing.sockets.add(socketId);
  onlineUsers.set(key, existing);

  return {
    firstConnection: existing.sockets.size === 1,
    presence: existing,
  };
};

export const removeConnection = (userId, socketId) => {
  const key = String(userId);
  const existing = onlineUsers.get(key);
  if (!existing) return { lastConnection: false, presence: null };

  existing.sockets.delete(socketId);
  if (existing.sockets.size === 0) {
    onlineUsers.delete(key);
    return { lastConnection: true, presence: existing };
  }

  return { lastConnection: false, presence: existing };
};

export const isUserOnline = (userId) => onlineUsers.has(String(userId));

export const getOnlineUsers = () => Array.from(onlineUsers.values()).map((presence) => ({
  user: presence.user,
  socketCount: presence.sockets.size,
  onlineAt: presence.onlineAt,
}));

export default {
  addConnection,
  removeConnection,
  isUserOnline,
  getOnlineUsers,
};
