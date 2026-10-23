import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Op } from 'sequelize';
import models, { sequelize } from '../../database/models/index.js';
import jwtConfig from '../../config/jwt.js';
import ApiError from '../../utils/ApiError.js';

const { User, Role, UserSession } = models;

const refreshTokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseDurationMs = (value) => {
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const sanitizeUser = (user) => {
  const plain = user.get({ plain: true });
  delete plain.password_hash;
  return plain;
};

const createAccessToken = (user) => {
  const roleName = user.role?.name;

  return jwt.sign(
    {
      sub: String(user.id),
      role: roleName,
      email: user.email,
    },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn },
  );
};

const createRefreshToken = (user) => jwt.sign(
  {
    sub: String(user.id),
    tokenType: 'refresh',
  },
  jwtConfig.refreshSecret,
  { expiresIn: jwtConfig.refreshExpiresIn },
);

const issueTokens = async (user, requestMeta = {}, transaction = null) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const expiresAt = new Date(Date.now() + parseDurationMs(jwtConfig.refreshExpiresIn));

  await UserSession.create({
    user_id: user.id,
    refresh_token_hash: refreshTokenHash(refreshToken),
    ip_address: requestMeta.ipAddress || null,
    user_agent: requestMeta.userAgent || null,
    expires_at: expiresAt,
  }, { transaction });

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
};

export const login = async ({ email, password }, requestMeta = {}) => {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new ApiError(403, 'User account is not active');

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) throw new ApiError(401, 'Invalid email or password');

  const tokens = await sequelize.transaction(async (transaction) => {
    await user.update({ last_login_at: new Date() }, { transaction });
    return issueTokens(user, requestMeta, transaction);
  });

  return {
    user: sanitizeUser(user),
    tokens,
  };
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;

  await UserSession.update(
    { revoked_at: new Date() },
    {
      where: {
        refresh_token_hash: refreshTokenHash(refreshToken),
        revoked_at: null,
      },
    },
  );
};

export const refresh = async (refreshToken, requestMeta = {}) => {
  if (!refreshToken) throw new ApiError(401, 'Refresh token is required');

  let payload;
  try {
    payload = jwt.verify(refreshToken, jwtConfig.refreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (payload.tokenType !== 'refresh') throw new ApiError(401, 'Invalid refresh token type');

  return sequelize.transaction(async (transaction) => {
    const session = await UserSession.findOne({
      where: {
        refresh_token_hash: refreshTokenHash(refreshToken),
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!session) throw new ApiError(401, 'Refresh token has expired or was revoked');

    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, as: 'role' }],
      transaction,
    });

    if (!user || user.status !== 'active') throw new ApiError(401, 'User is no longer active');

    await session.update({ revoked_at: new Date() }, { transaction });
    const tokens = await issueTokens(user, requestMeta, transaction);

    return {
      user: sanitizeUser(user),
      tokens,
    };
  });
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!passwordValid) throw new ApiError(400, 'Current password is incorrect');

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await sequelize.transaction(async (transaction) => {
    await user.update({ password_hash: passwordHash }, { transaction });
    await UserSession.update(
      { revoked_at: new Date() },
      {
        where: {
          user_id: user.id,
          revoked_at: null,
        },
        transaction,
      },
    );
  });
};

export const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role', include: [{ model: models.Permission, as: 'permissions' }] }],
  });

  if (!user) throw new ApiError(404, 'User not found');
  return sanitizeUser(user);
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.accessSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }
};

export const AuthService = {
  login,
  logout,
  refresh,
  changePassword,
  getProfile,
  verifyAccessToken,
};

export default AuthService;
