import axios from 'axios';
import crypto from 'node:crypto';
import openaiConfig from '../../config/openai.js';
import ApiError from '../../utils/ApiError.js';

const createClient = () => {
  if (!openaiConfig.apiKey) throw new ApiError(500, 'OPENAI_API_KEY is not configured');

  return axios.create({
    baseURL: openaiConfig.baseURL,
    timeout: 45000,
    headers: {
      Authorization: `Bearer ${openaiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
};

const extractOutputText = (response) => {
  if (response.output_text) return response.output_text;

  const parts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text);
      if (content.text && typeof content.text === 'string') parts.push(content.text);
    }
  }

  return parts.join('\n').trim();
};

export const createResponse = async ({ instructions, input, model, temperature }) => {
  try {
    const client = createClient();
    const response = await client.post('/responses', {
      model: model || openaiConfig.model,
      instructions,
      input,
      temperature,
    }, {
      headers: {
        'X-Client-Request-Id': crypto.randomUUID(),
      },
    });

    return {
      raw: response.data,
      outputText: extractOutputText(response.data),
      requestId: response.headers['x-request-id'] || null,
    };
  } catch (error) {
    const status = error.response?.status || 502;
    const payload = error.response?.data;
    const message = payload?.error?.message || payload?.message || error.message || 'OpenAI request failed';
    throw new ApiError(status, message, payload || null);
  }
};

export default {
  createResponse,
};
