import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "../api/authStorage";
import { Chat, ChatMessage, Paginated } from "../api/types";

let socket: Socket | null = null;

export const getSocket = () => socket;

const socketBaseUrl = () =>
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const isPaginated = <T>(data: any): data is Paginated<T> =>
  !!data && Array.isArray(data.rows);

const appendMessage = (
  data: Paginated<ChatMessage> | undefined,
  message: ChatMessage,
) => {
  if (!isPaginated<ChatMessage>(data)) return data;

  const exists = data.rows.some((item) => item.id === message.id);
  if (exists) return data;

  return {
    ...data,
    rows: [...data.rows, message],
    pagination: {
      ...(data.pagination || {}),
      total: Number(data.pagination?.total || data.rows.length) + 1,
    },
  };
};

const updateChatRow = (row: Chat, patch: Partial<Chat>) => ({
  ...row,
  ...patch,
  contact: patch.contact || row.contact,
});

export const useRealtimeChat = (chatId?: number | string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return undefined;

    socket ||= io(`${socketBaseUrl()}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onNewMessage = (payload: any) => {
      const incomingChatId = payload.chatId || payload.message?.chat_id;
      const message = payload.message;

      if (!incomingChatId || !message) return;

      queryClient.setQueriesData<Paginated<ChatMessage>>(
        { queryKey: ["chats", incomingChatId, "messages"] },
        (current) => appendMessage(current, message),
      );

      queryClient.setQueriesData<Paginated<Chat>>(
        { queryKey: ["chats"] },
        (current) => {
          if (!isPaginated<Chat>(current)) return current;

          return {
            ...current,
            rows: current.rows.map((chat) =>
              chat.id === Number(incomingChatId)
                ? updateChatRow(chat, {
                    last_message_at:
                      message.message_timestamp || message.created_at,
                    unread_count:
                      payload.chat?.unread_count ?? chat.unread_count,
                    status: payload.chat?.status ?? chat.status,
                  })
                : chat,
            ),
          };
        },
      );
    };

    const onChatUpdated = (payload: any) => {
      const updatedChat = payload.chat;
      const incomingChatId = payload.chatId || updatedChat?.id;

      if (!incomingChatId) return;

      queryClient.setQueriesData<Paginated<Chat>>(
        { queryKey: ["chats"] },
        (current) => {
          if (!isPaginated<Chat>(current)) return current;

          const exists = current.rows.some(
            (chat) => chat.id === Number(incomingChatId),
          );

          return {
            ...current,
            rows: exists
              ? current.rows.map((chat) =>
                  chat.id === Number(incomingChatId)
                    ? updateChatRow(chat, updatedChat || {})
                    : chat,
                )
              : updatedChat
                ? [updatedChat, ...current.rows]
                : current.rows,
          };
        },
      );

      if (updatedChat) {
        queryClient.setQueryData(["chats", incomingChatId], updatedChat);
      }
    };

    const onContactUpdated = (payload: any) => {
      const contact = payload.contact;
      if (!contact) return;

      queryClient.setQueriesData<Paginated<Chat>>(
        { queryKey: ["chats"] },
        (current) => {
          if (!isPaginated<Chat>(current)) return current;

          return {
            ...current,
            rows: current.rows.map((chat) =>
              chat.contact?.id === contact.id
                ? updateChatRow(chat, { contact })
                : chat,
            ),
          };
        },
      );
    };

    socket.on("new-message", onNewMessage);
    socket.on("chat-updated", onChatUpdated);
    socket.on("contact-updated", onContactUpdated);

    if (chatId) socket.emit("chat:join", { chatId });

    return () => {
      if (chatId) socket?.emit("chat:leave", { chatId });
      socket?.off("new-message", onNewMessage);
      socket?.off("chat-updated", onChatUpdated);
      socket?.off("contact-updated", onContactUpdated);
    };
  }, [chatId, queryClient]);
};
