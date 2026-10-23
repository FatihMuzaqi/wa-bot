import { api, unwrap } from '../api/http';

export type BotMenu = Record<string, any>;

export const botMenusService = {
  list: () => unwrap<BotMenu[]>(api.get('/bot-menus')),
  defaultMenu: () => unwrap<BotMenu | null>(api.get('/bot-menus/default')),
  detail: (menuId: number | string) => unwrap<BotMenu>(api.get(`/bot-menus/${menuId}`)),
  create: (payload: Record<string, unknown>) => unwrap<BotMenu>(api.post('/bot-menus', payload)),
  update: ({ menuId, payload }: { menuId: number | string; payload: Record<string, unknown> }) => (
    unwrap<BotMenu>(api.patch(`/bot-menus/${menuId}`, payload))
  ),
  remove: (menuId: number | string) => unwrap(api.delete(`/bot-menus/${menuId}`)),
  createItem: ({ menuId, payload }: { menuId: number | string; payload: Record<string, unknown> }) => (
    unwrap<BotMenu>(api.post(`/bot-menus/${menuId}/items`, payload))
  ),
  updateItem: ({ menuId, itemId, payload }: { menuId: number | string; itemId: number | string; payload: Record<string, unknown> }) => (
    unwrap<BotMenu>(api.patch(`/bot-menus/${menuId}/items/${itemId}`, payload))
  ),
  deleteItem: ({ menuId, itemId }: { menuId: number | string; itemId: number | string }) => (
    unwrap<BotMenu>(api.delete(`/bot-menus/${menuId}/items/${itemId}`))
  ),
  reorderItems: ({ menuId, items }: { menuId: number | string; items: Array<number | string> }) => (
    unwrap<BotMenu>(api.patch(`/bot-menus/${menuId}/reorder`, { items }))
  ),
};
