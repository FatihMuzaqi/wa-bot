import ApiError from '../utils/ApiError.js';

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication is required'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }
  return next();
};

export const authorizePermission = (resource, action) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication is required'));

  const allowed = req.user.permissions.some((permission) => (
    permission.resource === resource && permission.action === action
  ));

  if (!allowed) return next(new ApiError(403, 'Missing required permission'));
  return next();
};

export default authorizeRoles;
