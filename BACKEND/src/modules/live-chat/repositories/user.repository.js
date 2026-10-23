import models from '../../../database/models/index.js';
import { ROLES } from '../../../constants/roles.js';

const { User, Role } = models;

export const findAgentById = (userId) => User.findOne({
  where: { id: userId, status: 'active' },
  include: [{
    model: Role,
    as: 'role',
    where: { name: ROLES.AGENT },
  }],
});

export const findUserById = (userId) => User.findByPk(userId, {
  include: [{ model: Role, as: 'role' }],
});

export default {
  findAgentById,
  findUserById,
};
