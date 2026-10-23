import models from '../../../database/models/index.js';

const { AiPrompt } = models;

export const findActivePrompt = (promptType = 'system') => AiPrompt.findOne({
  where: {
    prompt_type: promptType,
    is_active: true,
  },
  order: [['updated_at', 'DESC']],
});

export const findAllPrompts = () => AiPrompt.findAll({
  order: [['prompt_type', 'ASC'], ['updated_at', 'DESC']],
});

export const createPrompt = (payload) => AiPrompt.create(payload);

export const updatePrompt = async (promptId, payload) => {
  const prompt = await AiPrompt.findByPk(promptId);
  if (!prompt) return null;
  return prompt.update(payload);
};

export const deletePrompt = async (promptId) => {
  const prompt = await AiPrompt.findByPk(promptId);
  if (!prompt) return false;
  await prompt.destroy();
  return true;
};

export default {
  findActivePrompt,
  findAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
};
