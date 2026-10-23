import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatsService } from '../services/chats.service';
import { Chat, ChatMessage, Paginated } from '../api/types';

export const useChats = (params?: Record<string, unknown>) => useQuery({
  queryKey: ['chats', params],
  queryFn: () => chatsService.list(params),
});

export const useChatDetail = (chatId?: number | string) => useQuery({
  queryKey: ['chats', chatId],
  queryFn: () => chatsService.detail(chatId!),
  enabled: Boolean(chatId),
});

export const useChatMessages = (chatId?: number | string, params?: Record<string, unknown>) => useQuery({
  queryKey: ['chats', chatId, 'messages', params],
  queryFn: () => chatsService.messages(chatId!, params),
  enabled: Boolean(chatId),
});

export const useSendMessage = (chatId?: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { text: string; number: string; instanceName?: string }) => chatsService.sendMessage(chatId!, payload),
    onSuccess: (message) => {
      queryClient.setQueriesData<Paginated<ChatMessage>>(
        { queryKey: ['chats', chatId, 'messages'] },
        (current) => {
          if (!current || current.rows.some((item) => item.id === message.id)) return current;
          return {
            ...current,
            rows: [...current.rows, message],
            pagination: {
              ...current.pagination,
              total: current.pagination.total + 1,
            },
          };
        },
      );

      queryClient.setQueriesData<Paginated<Chat>>(
        { queryKey: ['chats'] },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            rows: current.rows.map((chat) => (
              chat.id === Number(chatId)
                ? { ...chat, last_message_at: message.created_at, unread_count: 0, status: 'open' }
                : chat
            )),
          };
        },
      );
    },
  });
};

export const useTakeOverChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatsService.takeOver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] }),
  });
};

export const useTransferChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, agentId, note }: { chatId: number | string; agentId: number | string; note?: string }) => (
      chatsService.transfer(chatId, agentId, note)
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] }),
  });
};
