import models from '../../../database/models/index.js';

const { BotRule } = models;

export const findActiveRules = () => BotRule.findAll({
  where: { is_active: true },
  order: [['priority', 'ASC'], ['id', 'ASC']],
});

export default {
  findActiveRules,
};
