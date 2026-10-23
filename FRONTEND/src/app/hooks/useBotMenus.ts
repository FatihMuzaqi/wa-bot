import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { botMenusService } from '../services/botMenus.service';

export const useBotMenus = () => useQuery({
  queryKey: ['bot-menus'],
  queryFn: botMenusService.list,
});

export const useCreateBotMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};

export const useUpdateBotMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};

export const useDeleteBotMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};

export const useCreateBotMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.createItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};

export const useUpdateBotMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.updateItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};

export const useDeleteBotMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.deleteItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};

export const useReorderBotMenuItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: botMenusService.reorderItems,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-menus'] }),
  });
};
