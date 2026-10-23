import BotMenusService from './botMenus.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

export const list = asyncHandler(async (_req, res) => (
  successResponse(res, await BotMenusService.list(), 'Bot menus loaded')
));

export const defaultMenu = asyncHandler(async (_req, res) => (
  successResponse(res, await BotMenusService.getDefaultMenu(), 'Default bot menu loaded')
));

export const detail = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.detail(req.params.id), 'Bot menu loaded')
));

export const create = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.create(req.user, req.body), 'Bot menu created', 201)
));

export const update = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.update(req.params.id, req.body), 'Bot menu updated')
));

export const remove = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.remove(req.params.id), 'Bot menu deleted')
));

export const createItem = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.createItem(req.params.id, req.body), 'Bot menu item created', 201)
));

export const updateItem = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.updateItem(req.params.id, req.params.itemId, req.body), 'Bot menu item updated')
));

export const deleteItem = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.deleteItem(req.params.id, req.params.itemId), 'Bot menu item deleted')
));

export const reorderItems = asyncHandler(async (req, res) => (
  successResponse(res, await BotMenusService.reorderItems(req.params.id, req.body), 'Bot menu items reordered')
));

export default {
  list,
  defaultMenu,
  detail,
  create,
  update,
  remove,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
};
