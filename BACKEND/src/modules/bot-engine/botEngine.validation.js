import ApiError from '../../utils/ApiError.js';

const validate = (schema) => (req, _res, next) => {
  try {
    schema(req);
    next();
  } catch (error) {
    next(error);
  }
};

const requiredPositiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

const optionalPositiveInteger = (value, field) => {
  if (value === undefined || value === null || value === '') return;
  requiredPositiveInteger(value, field);
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

export const validateExecute = validate(({ body }) => {
  requiredPositiveInteger(body.chatId, 'chatId');
  optionalPositiveInteger(body.messageId, 'messageId');
  optionalString(body.text, 'text');
  optionalString(body.instanceName, 'instanceName');

  if (!body.messageId && !body.text) {
    throw new ApiError(422, 'messageId or text is required');
  }
});

export const validateTestMatch = validate(({ body }) => {
  requiredString(body.text, 'text');
});

export const validateQueue = validate(({ body }) => {
  requiredPositiveInteger(body.chatId, 'chatId');
  optionalPositiveInteger(body.messageId, 'messageId');
  optionalString(body.text, 'text');
  optionalString(body.instanceName, 'instanceName');

  if (!body.messageId && !body.text) {
    throw new ApiError(422, 'messageId or text is required');
  }
});
