import ApiError from '../../utils/ApiError.js';

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

const requiredPositiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

export const validateChatId = validate(({ params }) => {
  requiredPositiveInteger(params.chatId, 'chatId');
});

export const validateChatList = validate(({ query }) => {
  optionalString(query.status, 'status');
  optionalString(query.search, 'search');
  optionalString(query.scope, 'scope');

  if (query.status && !['open', 'pending', 'closed', 'bot'].includes(query.status)) {
    throw new ApiError(422, 'status must be one of open, pending, closed, bot');
  }

  if (query.scope && !['assigned', 'pending'].includes(query.scope)) {
    throw new ApiError(422, 'scope must be one of assigned, pending');
  }
});

export const validateSendMessage = validate(({ params, body }) => {
  requiredPositiveInteger(params.chatId, 'chatId');
  requiredString(body.text, 'text');
  optionalString(body.instanceName, 'instanceName');
});

export const validateAssignAgent = validate(({ params, body }) => {
  requiredPositiveInteger(params.chatId, 'chatId');
  requiredPositiveInteger(body.agentId, 'agentId');
});

export const validateTransferAgent = validate(({ params, body }) => {
  requiredPositiveInteger(params.chatId, 'chatId');
  requiredPositiveInteger(body.agentId, 'agentId');
  optionalString(body.note, 'note');
});
