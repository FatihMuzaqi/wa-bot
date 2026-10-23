import models from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { Setting } = models;

export const list = async (query = {}) => {
  const where = {};
  if (query.group) where.setting_group = query.group;
  return Setting.findAll({ where, order: [['setting_group', 'ASC'], ['setting_key', 'ASC']] });
};

export const get = async (key) => {
  const setting = await Setting.findOne({ where: { setting_key: key } });
  if (!setting) throw new ApiError(404, 'Setting not found');
  return setting;
};

export const upsert = async (user, payload) => {
  const [setting, created] = await Setting.findOrCreate({
    where: { setting_key: payload.key || payload.settingKey || payload.setting_key },
    defaults: {
      setting_key: payload.key || payload.settingKey || payload.setting_key,
      setting_group: payload.group || payload.settingGroup || payload.setting_group || 'general',
      value: payload.value ?? {},
      is_encrypted: payload.isEncrypted ?? payload.is_encrypted ?? false,
      updated_by: user.id,
    },
  });

  if (!created) {
    await setting.update({
      setting_group: payload.group || payload.settingGroup || payload.setting_group || setting.setting_group,
      value: payload.value ?? setting.value,
      is_encrypted: payload.isEncrypted ?? payload.is_encrypted ?? setting.is_encrypted,
      updated_by: user.id,
    });
  }

  return setting.reload();
};

export const update = async (user, key, payload) => {
  const setting = await get(key);
  await setting.update({
    ...(payload.group || payload.settingGroup || payload.setting_group ? {
      setting_group: payload.group || payload.settingGroup || payload.setting_group,
    } : {}),
    ...(payload.value !== undefined ? { value: payload.value } : {}),
    ...((payload.isEncrypted ?? payload.is_encrypted) !== undefined ? {
      is_encrypted: payload.isEncrypted ?? payload.is_encrypted,
    } : {}),
    updated_by: user.id,
  });
  return setting;
};

export default { list, get, upsert, update };
