import { Op } from 'sequelize';
import models, { sequelize } from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { BotMenu, BotMenuItem, Form } = models;

const defaultMenuValues = {
  title: 'Selamat datang di Company Site 👋',
  body_text: 'Silakan pilih layanan berikut:',
  unknown_text: 'Maaf, saya belum memahami pesan tersebut.\nSilakan pilih layanan berikut:',
  footer_text: 'Balas dengan angka pilihan atau ketik pertanyaan Anda.',
};

const menuIncludes = [
  {
    model: BotMenuItem,
    as: 'items',
    separate: true,
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    include: [{ model: Form, as: 'form', attributes: ['id', 'name', 'status'] }],
  },
];

const normalizeMenuPayload = (payload) => ({
  ...(payload.name !== undefined && { name: payload.name }),
  ...(payload.title !== undefined && { title: payload.title }),
  ...((payload.bodyText ?? payload.body_text) !== undefined && { body_text: payload.bodyText ?? payload.body_text }),
  ...((payload.footerText ?? payload.footer_text) !== undefined && { footer_text: (payload.footerText ?? payload.footer_text) || null }),
  ...((payload.unknownText ?? payload.unknown_text) !== undefined && { unknown_text: payload.unknownText ?? payload.unknown_text }),
  ...((payload.isDefault ?? payload.is_default) !== undefined && { is_default: Boolean(payload.isDefault ?? payload.is_default) }),
  ...((payload.isActive ?? payload.is_active) !== undefined && { is_active: Boolean(payload.isActive ?? payload.is_active) }),
});

const normalizeItemPayload = (payload) => {
  const actionType = payload.actionType || payload.action_type;
  return {
    ...(payload.number !== undefined && { number: String(payload.number).trim() }),
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.description !== undefined && { description: payload.description || null }),
    ...(actionType !== undefined && { action_type: actionType }),
    ...((payload.triggerValue ?? payload.trigger_value) !== undefined && {
      trigger_value: (payload.triggerValue ?? payload.trigger_value) || null,
    }),
    ...((payload.formId ?? payload.form_id) !== undefined && {
      form_id: payload.formId || payload.form_id ? Number(payload.formId ?? payload.form_id) : null,
    }),
    ...((payload.responseText ?? payload.response_text) !== undefined && {
      response_text: (payload.responseText ?? payload.response_text) || null,
    }),
    ...((payload.sortOrder ?? payload.sort_order) !== undefined && {
      sort_order: Number(payload.sortOrder ?? payload.sort_order),
    }),
    ...((payload.isActive ?? payload.is_active) !== undefined && {
      is_active: Boolean(payload.isActive ?? payload.is_active),
    }),
  };
};

const enforceDefaultMenu = async (menu, transaction = null) => {
  if (!menu.is_default) return;
  await BotMenu.update(
    { is_default: false },
    {
      where: { id: { [Op.ne]: menu.id }, is_default: true },
      transaction,
    },
  );
};

const validateItemAction = async (payload) => {
  const actionType = payload.action_type || payload.actionType;
  const formId = payload.form_id || payload.formId;

  if (actionType === 'form') {
    const form = await Form.findOne({ where: { id: formId, status: 'active' } });
    if (!form) throw new ApiError(422, 'Selected form is not active or does not exist');
  }
};

export const formatMenuText = (menu, mode = 'welcome') => {
  const source = menu?.toJSON ? menu.toJSON() : menu;
  const activeItems = (source?.items || [])
    .filter((item) => item.is_active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id || 0) - Number(b.id || 0));
  const heading = mode === 'unknown'
    ? (source.unknown_text || defaultMenuValues.unknown_text)
    : [source.title || defaultMenuValues.title, source.body_text || defaultMenuValues.body_text].filter(Boolean).join('\n\n');
  const itemLines = activeItems.map((item) => {
    const description = item.description ? ` - ${item.description}` : '';
    return `${item.number}. ${item.title}${description}`;
  });

  return [
    heading,
    itemLines.join('\n'),
    source.footer_text || defaultMenuValues.footer_text,
  ].filter(Boolean).join('\n\n');
};

export const toPendingMenuState = (menu) => {
  const source = menu?.toJSON ? menu.toJSON() : menu;
  return {
    menuId: source.id,
    sentAt: new Date().toISOString(),
    items: (source.items || [])
      .filter((item) => item.is_active !== false)
      .map((item) => ({
        number: String(item.number),
        itemId: item.id,
        title: item.title,
        actionType: item.action_type,
        triggerValue: item.trigger_value,
        formId: item.form_id,
        responseText: item.response_text,
      })),
  };
};

export const list = () => BotMenu.findAll({
  include: menuIncludes,
  order: [['is_default', 'DESC'], ['updated_at', 'DESC'], ['id', 'DESC']],
});

export const detail = async (menuId) => {
  const menu = await BotMenu.findByPk(menuId, { include: menuIncludes });
  if (!menu) throw new ApiError(404, 'Bot menu not found');
  return menu;
};

export const getDefaultMenu = async () => {
  const menu = await BotMenu.findOne({
    where: { is_active: true, is_default: true },
    include: menuIncludes,
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
  });
  if (menu) return menu;

  return BotMenu.findOne({
    where: { is_active: true },
    include: menuIncludes,
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
  });
};

export const create = async (user, payload) => {
  let menuId = null;
  await sequelize.transaction(async (transaction) => {
    const menu = await BotMenu.create({
      ...defaultMenuValues,
      ...normalizeMenuPayload(payload),
      created_by: user.id,
    }, { transaction });
    await enforceDefaultMenu(menu, transaction);
    menuId = menu.id;
  });
  return detail(menuId);
};

export const update = async (menuId, payload) => {
  await sequelize.transaction(async (transaction) => {
    const menu = await BotMenu.findByPk(menuId, { transaction });
    if (!menu) throw new ApiError(404, 'Bot menu not found');
    await menu.update(normalizeMenuPayload(payload), { transaction });
    await enforceDefaultMenu(menu, transaction);
  });
  return detail(menuId);
};

export const remove = async (menuId) => {
  const menu = await detail(menuId);
  await menu.destroy();
  return { id: Number(menuId) };
};

export const createItem = async (menuId, payload) => {
  await detail(menuId);
  const maxOrder = await BotMenuItem.max('sort_order', { where: { bot_menu_id: menuId } });
  const itemPayload = {
    sort_order: Number(maxOrder || 0) + 1,
    is_active: true,
    ...normalizeItemPayload(payload),
    bot_menu_id: menuId,
  };
  await validateItemAction(itemPayload);
  await BotMenuItem.create(itemPayload);
  return detail(menuId);
};

export const updateItem = async (menuId, itemId, payload) => {
  await detail(menuId);
  const item = await BotMenuItem.findOne({ where: { id: itemId, bot_menu_id: menuId } });
  if (!item) throw new ApiError(404, 'Bot menu item not found');
  const itemPayload = normalizeItemPayload(payload);
  await validateItemAction({ ...item.toJSON(), ...itemPayload });
  await item.update(itemPayload);
  return detail(menuId);
};

export const deleteItem = async (menuId, itemId) => {
  await detail(menuId);
  const item = await BotMenuItem.findOne({ where: { id: itemId, bot_menu_id: menuId } });
  if (!item) throw new ApiError(404, 'Bot menu item not found');
  await item.destroy();
  return detail(menuId);
};

export const reorderItems = async (menuId, payload) => {
  await detail(menuId);
  const requested = payload.items || payload.itemIds;
  const ids = requested.map((item) => Number(typeof item === 'object' ? item.id : item));
  const uniqueIds = [...new Set(ids)];
  const items = await BotMenuItem.findAll({ where: { bot_menu_id: menuId, id: { [Op.in]: uniqueIds } } });
  if (items.length !== uniqueIds.length) throw new ApiError(422, 'One or more items do not belong to this menu');

  const byId = new Map(items.map((item) => [Number(item.id), item]));
  await sequelize.transaction(async (transaction) => {
    await Promise.all(items.map((item, index) => item.update({ sort_order: 100000 + index }, { transaction })));
    await Promise.all(uniqueIds.map((id, index) => byId.get(id).update({ sort_order: index + 1 }, { transaction })));
  });

  return detail(menuId);
};

export default {
  list,
  detail,
  getDefaultMenu,
  create,
  update,
  remove,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  formatMenuText,
  toPendingMenuState,
};
