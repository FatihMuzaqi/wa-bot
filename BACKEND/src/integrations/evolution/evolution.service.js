import axios from 'axios';
import ApiError from '../../utils/ApiError.js';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const evolutionConfig = () => ({
  baseURL: trimTrailingSlash(process.env.EVOLUTION_URL),
  apiKey: process.env.EVOLUTION_API_KEY,
  defaultInstance: process.env.EVOLUTION_INSTANCE,
});

const createClient = () => {
  const config = evolutionConfig();

  if (!config.baseURL) throw new ApiError(500, 'EVOLUTION_URL is not configured');
  if (!config.apiKey) throw new ApiError(500, 'EVOLUTION_API_KEY is not configured');

  return axios.create({
    baseURL: config.baseURL,
    timeout: 30000,
    headers: {
      apikey: config.apiKey,
      'Content-Type': 'application/json',
    },
  });
};

const resolveInstance = (instanceName) => {
  const instance = instanceName || evolutionConfig().defaultInstance;
  if (!instance) throw new ApiError(422, 'Evolution instance is required');
  return instance;
};

const unwrap = (response) => response.data;

const handleEvolutionError = (error) => {
  const status = error.response?.status || 502;
  const payload = error.response?.data;
  const message = payload?.message || payload?.error || error.message || 'Evolution API request failed';
  throw new ApiError(status, message, payload || null);
};

const request = async (method, url, data = undefined) => {
  try {
    const client = createClient();
    return unwrap(await client.request({ method, url, data }));
  } catch (error) {
    handleEvolutionError(error);
  }
};

export const createInstance = ({ instanceName, qrcode = true, webhook = null, integration = 'WHATSAPP-BAILEYS' }) => (
  request('post', '/instance/create', {
    instanceName,
    qrcode,
    integration,
    webhook,
  })
);

export const deleteInstance = (instanceName) => {
  const instance = resolveInstance(instanceName);
  return request('delete', `/instance/delete/${encodeURIComponent(instance)}`);
};

export const restartInstance = (instanceName) => {
  const instance = resolveInstance(instanceName);
  return request('put', `/instance/restart/${encodeURIComponent(instance)}`);
};

export const getQrCode = (instanceName) => {
  const instance = resolveInstance(instanceName);
  return request('get', `/instance/connect/${encodeURIComponent(instance)}`);
};

export const getConnectionStatus = (instanceName) => {
  const instance = resolveInstance(instanceName);
  return request('get', `/instance/connectionState/${encodeURIComponent(instance)}`);
};

export const sendText = ({ instanceName, number, text, delay = 0, quoted = null }) => {
  const instance = resolveInstance(instanceName);
  return request('post', `/message/sendText/${encodeURIComponent(instance)}`, {
    number,
    text,
    delay,
    quoted,
  });
};

export const sendImage = ({ instanceName, number, media, caption = '', fileName = null, delay = 0 }) => {
  const instance = resolveInstance(instanceName);
  return request('post', `/message/sendMedia/${encodeURIComponent(instance)}`, {
    number,
    mediatype: 'image',
    media,
    caption,
    fileName,
    delay,
  });
};

export const sendDocument = ({ instanceName, number, media, fileName, caption = '', mimetype = null, delay = 0 }) => {
  const instance = resolveInstance(instanceName);
  return request('post', `/message/sendMedia/${encodeURIComponent(instance)}`, {
    number,
    mediatype: 'document',
    media,
    caption,
    fileName,
    mimetype,
    delay,
  });
};

export const sendAudio = ({ instanceName, number, audio, delay = 0, ptt = false }) => {
  const instance = resolveInstance(instanceName);
  return request('post', `/message/sendWhatsAppAudio/${encodeURIComponent(instance)}`, {
    number,
    audio,
    delay,
    ptt,
  });
};

export const sendVideo = ({ instanceName, number, media, caption = '', fileName = null, delay = 0 }) => {
  const instance = resolveInstance(instanceName);
  return request('post', `/message/sendMedia/${encodeURIComponent(instance)}`, {
    number,
    mediatype: 'video',
    media,
    caption,
    fileName,
    delay,
  });
};

export const EvolutionService = {
  createInstance,
  deleteInstance,
  restartInstance,
  getQrCode,
  getConnectionStatus,
  sendText,
  sendImage,
  sendDocument,
  sendAudio,
  sendVideo,
};

export default EvolutionService;
