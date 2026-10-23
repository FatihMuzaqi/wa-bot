import ApiError from '../../utils/ApiError.js';

const validate = (schema) => (req, _res, next) => {
  try {
    schema(req);
    next();
  } catch (error) {
    next(error);
  }
};

const optionalString = (value, field) => {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new ApiError(422, `${field} must be a string`);
  }
};

const requiredString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(422, `${field} is required`);
  }
};

const optionalNumber = (value, field) => {
  if (value !== undefined && (typeof value !== 'number' || Number.isNaN(value))) {
    throw new ApiError(422, `${field} must be a number`);
  }
};

const optionalPositiveInteger = (value, field) => {
  if (value === undefined || value === null) return;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(422, `${field} must be a positive integer`);
  }
};

const requiredNumber = (body) => requiredString(body.number, 'number');
const optionalInstance = (body) => optionalString(body.instanceName, 'instanceName');

export const validateCreateInstance = validate(({ body }) => {
  requiredString(body.instanceName, 'instanceName');
  optionalString(body.integration, 'integration');
});

export const validateInstanceParam = validate(({ params }) => {
  optionalString(params.instanceName, 'instanceName');
});

export const validateSendText = validate(({ body }) => {
  optionalInstance(body);
  optionalPositiveInteger(body.chatId, 'chatId');
  requiredNumber(body);
  requiredString(body.text, 'text');
  optionalNumber(body.delay, 'delay');
});

export const validateSendImage = validate(({ body }) => {
  optionalInstance(body);
  requiredNumber(body);
  requiredString(body.media, 'media');
  optionalString(body.caption, 'caption');
  optionalString(body.fileName, 'fileName');
  optionalNumber(body.delay, 'delay');
});

export const validateSendDocument = validate(({ body }) => {
  optionalInstance(body);
  requiredNumber(body);
  requiredString(body.media, 'media');
  requiredString(body.fileName, 'fileName');
  optionalString(body.caption, 'caption');
  optionalString(body.mimetype, 'mimetype');
  optionalNumber(body.delay, 'delay');
});

export const validateSendAudio = validate(({ body }) => {
  optionalInstance(body);
  requiredNumber(body);
  requiredString(body.audio, 'audio');
  optionalNumber(body.delay, 'delay');
});

export const validateSendVideo = validate(({ body }) => {
  optionalInstance(body);
  requiredNumber(body);
  requiredString(body.media, 'media');
  optionalString(body.caption, 'caption');
  optionalString(body.fileName, 'fileName');
  optionalNumber(body.delay, 'delay');
});
