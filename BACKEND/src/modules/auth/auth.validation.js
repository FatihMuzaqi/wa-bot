import ApiError from '../../utils/ApiError.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(422, `${field} is required`);
  }
};

const assertPassword = (value, field = 'password') => {
  assertString(value, field);
  if (value.length < 8) {
    throw new ApiError(422, `${field} must be at least 8 characters`);
  }
};

const validate = (schema) => (req, _res, next) => {
  try {
    schema(req.body || {});
    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = validate((body) => {
  assertString(body.email, 'email');
  assertString(body.password, 'password');
  if (!emailRegex.test(body.email)) throw new ApiError(422, 'email must be valid');
});

export const validateRefreshToken = validate((body) => {
  assertString(body.refreshToken, 'refreshToken');
});

export const validateLogout = validate((body) => {
  assertString(body.refreshToken, 'refreshToken');
});

export const validateChangePassword = validate((body) => {
  assertPassword(body.currentPassword, 'currentPassword');
  assertPassword(body.newPassword, 'newPassword');

  if (body.currentPassword === body.newPassword) {
    throw new ApiError(422, 'newPassword must be different from currentPassword');
  }
});
