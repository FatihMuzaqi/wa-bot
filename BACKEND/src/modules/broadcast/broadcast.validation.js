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

const requiredPositiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

export const validateBroadcastId = validate(({ params }) => {
  requiredPositiveInteger(params.broadcastId, 'broadcastId');
});

export const validateCreateCampaign = validate(({ body }) => {
  requiredString(body.name, 'name');
  if (!body.messagePayload || typeof body.messagePayload !== 'object') {
    throw new ApiError(422, 'messagePayload is required');
  }
  if (body.messageType && !['text', 'media', 'template'].includes(body.messageType)) {
    throw new ApiError(422, 'messageType must be one of text, media, template');
  }
  if (!body.messagePayload.text && !body.messagePayload.message && !body.messagePayload.media) {
    throw new ApiError(422, 'messagePayload must contain text, message, or media');
  }
  if (!body.audienceFilter || typeof body.audienceFilter !== 'object') {
    throw new ApiError(422, 'audienceFilter is required');
  }
  if (body.scheduledAt) {
    const date = new Date(body.scheduledAt);
    if (Number.isNaN(date.getTime())) throw new ApiError(422, 'scheduledAt must be a valid date');
  }
});

export const validateScheduleCampaign = validate(({ params, body }) => {
  requiredPositiveInteger(params.broadcastId, 'broadcastId');
  requiredString(body.scheduledAt, 'scheduledAt');
  const date = new Date(body.scheduledAt);
  if (Number.isNaN(date.getTime())) throw new ApiError(422, 'scheduledAt must be a valid date');
});

export const validateDeliveryTracking = validate(({ body }) => {
  if (!body.evolutionMessageId && !body.messageId) {
    throw new ApiError(422, 'evolutionMessageId or messageId is required');
  }
  if (!['sent', 'delivered', 'read', 'failed'].includes(body.status)) {
    throw new ApiError(422, 'status must be one of sent, delivered, read, failed');
  }
});
