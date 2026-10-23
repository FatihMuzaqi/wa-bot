import { api, unwrap } from "../api/http";
import { Chat, ChatMessage, Paginated } from "../api/types";

export const chatsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<Paginated<Chat>>(api.get("/chats", { params })),
  detail: (chatId: number | string) =>
    unwrap<Chat>(api.get(`/chats/${chatId}`)),
  messages: (chatId: number | string, params?: Record<string, unknown>) =>
    unwrap<Paginated<ChatMessage>>(
      api.get(`/chats/${chatId}/messages`, { params }),
    ),
  sendMessage: (
    chatId: number | string,
    payload: { text: string; number?: string; instanceName?: string },
  ) => unwrap<ChatMessage>(api.post(`/chats/${chatId}/messages`, payload)),
  assign: (chatId: number | string, agentId: number | string) =>
    unwrap<Chat>(
      api.post(`/chats/${chatId}/assign`, { agentId: Number(agentId) }),
    ),
  takeOver: (chatId: number | string) =>
    unwrap<Chat>(api.post(`/chats/${chatId}/takeover`)),
  transfer: (
    chatId: number | string,
    agentId: number | string,
    note?: string,
  ) =>
    unwrap<Chat>(
      api.post(`/chats/${chatId}/transfer`, { agentId: Number(agentId), note }),
    ),
  close: (chatId: number | string) =>
    unwrap<Chat>(api.post(`/chats/${chatId}/close`)),
};
