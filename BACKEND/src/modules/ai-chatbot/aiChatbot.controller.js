import AiChatbotService from './aiChatbot.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

export const generateAnswer = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.generateAnswer(req.body);
  return successResponse(res, data, data.shouldFallback ? 'AI fallback detected' : 'AI answer generated');
});

export const listPrompts = asyncHandler(async (_req, res) => {
  const data = await AiChatbotService.listPrompts();
  return successResponse(res, data, 'Prompts loaded');
});

export const createPrompt = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.createPrompt(req.user, req.body);
  return successResponse(res, data, 'Prompt created', 201);
});

export const updatePrompt = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.updatePrompt(req.params.promptId, req.body);
  return successResponse(res, data, 'Prompt updated');
});

export const deletePrompt = asyncHandler(async (req, res) => {
  await AiChatbotService.deletePrompt(req.params.promptId);
  return successResponse(res, null, 'Prompt deleted');
});

export const listKnowledgeSources = asyncHandler(async (_req, res) => {
  const data = await AiChatbotService.listKnowledgeSources();
  return successResponse(res, data, 'Knowledge sources loaded');
});

export const getKnowledgeSource = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.getKnowledgeSource(req.params.sourceId);
  return successResponse(res, data, 'Knowledge source loaded');
});

export const createKnowledgeSource = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.createKnowledgeSource(req.user, req.body, req.file || null);
  return successResponse(res, data, 'Knowledge source created', 201);
});

export const addKnowledgeDocument = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.addKnowledgeDocument(req.params.sourceId, req.body, req.file || null);
  return successResponse(res, data, 'Knowledge document added', 201);
});

export const addFaq = asyncHandler(async (req, res) => {
  const data = await AiChatbotService.addFaq(req.user, req.body);
  return successResponse(res, data, 'FAQ added', 201);
});

export const deleteKnowledgeSource = asyncHandler(async (req, res) => {
  await AiChatbotService.deleteKnowledgeSource(req.params.sourceId);
  return successResponse(res, null, 'Knowledge source deleted');
});

export default {
  generateAnswer,
  listPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listKnowledgeSources,
  getKnowledgeSource,
  createKnowledgeSource,
  addKnowledgeDocument,
  addFaq,
  deleteKnowledgeSource,
};
