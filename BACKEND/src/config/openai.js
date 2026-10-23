import 'dotenv/config';

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  confidenceThreshold: Number(process.env.AI_CONFIDENCE_THRESHOLD || 0.65),
  maxContextChunks: Number(process.env.AI_MAX_CONTEXT_CHUNKS || 5),
};

export default openaiConfig;
