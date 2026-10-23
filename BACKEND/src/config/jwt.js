import 'dotenv/config';

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'development-access-secret-change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

export default jwtConfig;
