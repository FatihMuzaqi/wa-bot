import 'dotenv/config';

const bool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

export const databaseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'whatsapp_bot_platform',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: bool(process.env.DB_LOGGING) ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    paranoid: false,
  },
  dialectOptions: {
    charset: 'utf8mb4',
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default databaseConfig;
