import models from '../database/models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import ApiError from '../utils/ApiError.js';

const { User, Role, Permission } = models;

const extractBearerToken = (req) => {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new ApiError(401, 'Bearer token is required');
  }

  return token;
};

export const authenticate = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req);
    const payload = AuthService.verifyAccessToken(token);

    const user = await User.findByPk(payload.sub, {
      include: [{
        model: Role,
        as: 'role',
        include: [{ model: Permission, as: 'permissions' }],
      }],
    });

    if (!user || user.status !== 'active') {
      throw new ApiError(401, 'User is not authorized');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name,
      permissions: user.role?.permissions || [],
      model: user,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
