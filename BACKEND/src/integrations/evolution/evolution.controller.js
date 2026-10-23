import { EvolutionService } from './evolution.service.js';
import LiveChatService from '../../modules/live-chat/liveChat.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

const instanceFrom = (req) => req.params.instanceName || req.body.instanceName;

export const createInstance = asyncHandler(async (req, res) => {
  const data = await EvolutionService.createInstance(req.body);
  return successResponse(res, data, 'Evolution instance created', 201);
});

export const deleteInstance = asyncHandler(async (req, res) => {
  const data = await EvolutionService.deleteInstance(instanceFrom(req));
  return successResponse(res, data, 'Evolution instance deleted');
});

export const restartInstance = asyncHandler(async (req, res) => {
  const data = await EvolutionService.restartInstance(instanceFrom(req));
  return successResponse(res, data, 'Evolution instance restarted');
});

export const getQrCode = asyncHandler(async (req, res) => {
  const data = await EvolutionService.getQrCode(instanceFrom(req));
  return successResponse(res, data, 'Evolution QR code loaded');
});

export const getConnectionStatus = asyncHandler(async (req, res) => {
  const data = await EvolutionService.getConnectionStatus(instanceFrom(req));
  return successResponse(res, data, 'Evolution connection status loaded');
});

export const sendText = asyncHandler(async (req, res) => {
  if (req.body.chatId) {
    const data = await LiveChatService.sendMessage(req.user, req.body.chatId, {
      text: req.body.text,
      instanceName: req.body.instanceName,
    });
    return successResponse(res, data, 'Text message sent and saved');
  }

  const data = await EvolutionService.sendText(req.body);
  return successResponse(res, data, 'Text message sent');
});

export const sendImage = asyncHandler(async (req, res) => {
  const data = await EvolutionService.sendImage(req.body);
  return successResponse(res, data, 'Image message sent');
});

export const sendDocument = asyncHandler(async (req, res) => {
  const data = await EvolutionService.sendDocument(req.body);
  return successResponse(res, data, 'Document message sent');
});

export const sendAudio = asyncHandler(async (req, res) => {
  const data = await EvolutionService.sendAudio(req.body);
  return successResponse(res, data, 'Audio message sent');
});

export const sendVideo = asyncHandler(async (req, res) => {
  const data = await EvolutionService.sendVideo(req.body);
  return successResponse(res, data, 'Video message sent');
});

export default {
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
