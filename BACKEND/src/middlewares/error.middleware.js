import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    details: error.details || null,
  });
};

export default errorHandler;
