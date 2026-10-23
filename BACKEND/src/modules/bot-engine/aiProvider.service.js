import openaiConfig from '../../config/openai.js';
import ApiError from '../../utils/ApiError.js';
import OpenAIService from '../ai-chatbot/openai.service.js';
import GeminiService from './gemini.service.js';

export const getSelectedProvider = () => String(process.env.AI_PROVIDER || 'openai').trim().toLowerCase();

export const getSelectedModel = ({ provider, model } = {}) => {
  if (provider === 'gemini') return model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (provider === 'placeholder') return model || null;
  return model || openaiConfig.model;
};

export const createResponse = async ({ instructions, input, model, temperature }) => {
  const provider = getSelectedProvider();
  const selectedModel = getSelectedModel({ provider, model });

  console.log('[AIProvider] selected provider:', provider);
  console.log('[AIProvider] selected model:', selectedModel);

  if (provider === 'gemini') {
    return {
      provider,
      model: selectedModel,
      ...(await GeminiService.createResponse({
        instructions,
        input,
        model: selectedModel,
        temperature,
      })),
    };
  }

  if (provider === 'placeholder') {
    throw new ApiError(422, 'AI_PROVIDER placeholder does not call an external AI provider');
  }

  if (provider !== 'openai') {
    throw new ApiError(422, `Unsupported AI_PROVIDER: ${provider}`);
  }

  return {
    provider: 'openai',
    model: selectedModel,
    ...(await OpenAIService.createResponse({
      instructions,
      input,
      model: selectedModel,
      temperature,
    })),
  };
};

export default {
  getSelectedProvider,
  getSelectedModel,
  createResponse,
};
