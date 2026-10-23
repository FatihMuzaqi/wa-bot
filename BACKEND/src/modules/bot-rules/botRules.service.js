import models from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { BotRule, Form } = models;

const pagination = ({ rows, count }, page, limit) => ({
  rows,
  pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
});

const resolveResponseType = (payload, fallback = 'text') => (
  payload.responseType || payload.response_type || fallback
);

const resolveFormId = (payload) => payload.formId ?? payload.form_id ?? null;

const validateFormResponse = async ({ responseType, formId }) => {
  if (responseType !== 'form') return null;

  const numericFormId = Number(formId);
  if (!Number.isInteger(numericFormId) || numericFormId <= 0) {
    throw new ApiError(422, 'formId is required when responseType is form');
  }

  const form = await Form.findByPk(numericFormId);
  if (!form) throw new ApiError(404, 'Selected form not found');
  if (form.status !== 'active') throw new ApiError(422, 'Selected form must be active');
  return form;
};

const buildResponseFields = async (payload, fallback = {}) => {
  const responseType = resolveResponseType(payload, fallback.response_type || 'text');
  const rawFormId = resolveFormId(payload);
  const form = await validateFormResponse({ responseType, formId: rawFormId });

  if (responseType === 'form') {
    return {
      response_type: responseType,
      response_payload: {},
      form_id: form.id,
    };
  }

  return {
    response_type: responseType,
    response_payload: payload.responsePayload ?? payload.response_payload ?? fallback.response_payload ?? { text: payload.responseText || '' },
    form_id: null,
  };
};

export const list = async (query = {}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const where = {};
  if (query.isActive !== undefined) where.is_active = ['true', true, '1', 1].includes(query.isActive);
  if (query.triggerType) where.trigger_type = query.triggerType;

  const result = await BotRule.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['priority', 'ASC'], ['created_at', 'DESC']],
    include: [{ model: Form, as: 'form' }],
  });

  return pagination(result, page, limit);
};

export const detail = async (id) => {
  const rule = await BotRule.findByPk(id, { include: [{ model: Form, as: 'form' }] });
  if (!rule) throw new ApiError(404, 'Bot rule not found');
  return rule;
};

export const create = async (user, payload) => {
  const responseFields = await buildResponseFields(payload);

  return BotRule.create({
    name: payload.name,
    trigger_type: payload.triggerType || payload.trigger_type,
    trigger_value: payload.triggerValue || payload.trigger_value,
    ...responseFields,
    priority: payload.priority ?? 100,
    is_active: payload.isActive ?? payload.is_active ?? true,
    ai_fallback_enabled: payload.aiFallbackEnabled ?? payload.ai_fallback_enabled ?? false,
    created_by: user.id,
  });
};

export const update = async (id, payload) => {
  const rule = await detail(id);
  const hasResponseChange = (
    payload.responseType !== undefined ||
    payload.response_type !== undefined ||
    payload.responsePayload !== undefined ||
    payload.response_payload !== undefined ||
    payload.responseText !== undefined ||
    payload.formId !== undefined ||
    payload.form_id !== undefined
  );
  const responseFields = hasResponseChange
    ? await buildResponseFields(payload, rule)
    : {};

  await rule.update({
    ...(payload.name !== undefined && { name: payload.name }),
    ...((payload.triggerType || payload.trigger_type) && { trigger_type: payload.triggerType || payload.trigger_type }),
    ...((payload.triggerValue || payload.trigger_value) && { trigger_value: payload.triggerValue || payload.trigger_value }),
    ...responseFields,
    ...(payload.priority !== undefined && { priority: payload.priority }),
    ...((payload.isActive ?? payload.is_active) !== undefined && { is_active: payload.isActive ?? payload.is_active }),
    ...((payload.aiFallbackEnabled ?? payload.ai_fallback_enabled) !== undefined && {
      ai_fallback_enabled: payload.aiFallbackEnabled ?? payload.ai_fallback_enabled,
    }),
  });
  return detail(rule.id);
};

export const remove = async (id) => {
  const rule = await detail(id);
  await rule.destroy();
  return { id: rule.id };
};

export default { list, detail, create, update, remove };
