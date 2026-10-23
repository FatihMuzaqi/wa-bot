import ApiError from '../../utils/ApiError.js';

const actionTypes = ['trigger', 'form', 'text', 'transfer', 'ai'];

const validate = (schema) => (req, _res, next) => {
  try {
    schema(req);
    next();
  } catch (error) {
    next(error);
  }
};

const requiredString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(422, `${field} is required`);
  }
};

const optionalString = (value, field) => {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new ApiError(422, `${field} must be a string`);
  }
};

const positiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

const optionalBoolean = (value, field) => {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new ApiError(422, `${field} must be a boolean`);
  }
};

const validateActionPayload = (body, partial = false) => {
  const actionType = body.actionType || body.action_type;
  if (!partial || actionType !== undefined) {
    requiredString(actionType, 'actionType');
    if (!actionTypes.includes(actionType)) {
      throw new ApiError(422, 'actionType must be one of trigger, form, text, transfer, ai');
    }
  }

  if (actionType === 'trigger') requiredString(body.triggerValue || body.trigger_value, 'triggerValue');
  if (actionType === 'form') positiveInteger(body.formId || body.form_id, 'formId');
  if (actionType === 'text') requiredString(body.responseText || body.response_text, 'responseText');
};

export const validateMenuId = validate(({ params }) => {
  positiveInteger(params.id, 'id');
});

export const validateCreateMenu = validate(({ body }) => {
  requiredString(body.name, 'name');
  requiredString(body.title, 'title');
  requiredString(body.bodyText || body.body_text, 'bodyText');
  requiredString(body.unknownText || body.unknown_text, 'unknownText');
  optionalString(body.footerText || body.footer_text, 'footerText');
  optionalBoolean(body.isDefault ?? body.is_default, 'isDefault');
  optionalBoolean(body.isActive ?? body.is_active, 'isActive');
});

export const validateUpdateMenu = validate(({ params, body }) => {
  positiveInteger(params.id, 'id');
  optionalString(body.name, 'name');
  optionalString(body.title, 'title');
  optionalString(body.bodyText || body.body_text, 'bodyText');
  optionalString(body.unknownText || body.unknown_text, 'unknownText');
  optionalString(body.footerText || body.footer_text, 'footerText');
  optionalBoolean(body.isDefault ?? body.is_default, 'isDefault');
  optionalBoolean(body.isActive ?? body.is_active, 'isActive');
});

export const validateCreateItem = validate(({ params, body }) => {
  positiveInteger(params.id, 'id');
  requiredString(body.number, 'number');
  requiredString(body.title, 'title');
  optionalString(body.description, 'description');
  validateActionPayload(body);
  optionalBoolean(body.isActive ?? body.is_active, 'isActive');
});

export const validateUpdateItem = validate(({ params, body }) => {
  positiveInteger(params.id, 'id');
  positiveInteger(params.itemId, 'itemId');
  optionalString(body.number, 'number');
  optionalString(body.title, 'title');
  optionalString(body.description, 'description');
  validateActionPayload(body, true);
  optionalBoolean(body.isActive ?? body.is_active, 'isActive');
});

export const validateDeleteItem = validate(({ params }) => {
  positiveInteger(params.id, 'id');
  positiveInteger(params.itemId, 'itemId');
});

export const validateReorderItems = validate(({ params, body }) => {
  positiveInteger(params.id, 'id');
  const items = body.items || body.itemIds;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'items must be a non-empty array');
  }
});
