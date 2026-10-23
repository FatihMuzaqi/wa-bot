import { Router } from 'express';
import AiChatbotController from './aiChatbot.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  validateAddFaq,
  validateAddKnowledgeDocument,
  validateCreateKnowledgeSource,
  validateCreatePrompt,
  validateGenerateAnswer,
  validateKnowledgeSourceId,
  validatePromptId,
  validateUpdatePrompt,
} from './aiChatbot.validation.js';
import { uploadKnowledgeDocument } from './knowledgeUpload.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/generate', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateGenerateAnswer, AiChatbotController.generateAnswer);

router.get('/prompts', authorizeRoles(ROLES.ADMIN), AiChatbotController.listPrompts);
router.post('/prompts', authorizeRoles(ROLES.ADMIN), validateCreatePrompt, AiChatbotController.createPrompt);
router.patch('/prompts/:promptId', authorizeRoles(ROLES.ADMIN), validateUpdatePrompt, AiChatbotController.updatePrompt);
router.delete('/prompts/:promptId', authorizeRoles(ROLES.ADMIN), validatePromptId, AiChatbotController.deletePrompt);

router.get('/knowledge-sources', authorizeRoles(ROLES.ADMIN), AiChatbotController.listKnowledgeSources);
router.post('/knowledge-sources', authorizeRoles(ROLES.ADMIN), uploadKnowledgeDocument, validateCreateKnowledgeSource, AiChatbotController.createKnowledgeSource);
router.get('/knowledge-sources/:sourceId', authorizeRoles(ROLES.ADMIN), validateKnowledgeSourceId, AiChatbotController.getKnowledgeSource);
router.post('/knowledge-sources/:sourceId/documents', authorizeRoles(ROLES.ADMIN), uploadKnowledgeDocument, validateAddKnowledgeDocument, AiChatbotController.addKnowledgeDocument);
router.delete('/knowledge-sources/:sourceId', authorizeRoles(ROLES.ADMIN), validateKnowledgeSourceId, AiChatbotController.deleteKnowledgeSource);

router.post('/faq', authorizeRoles(ROLES.ADMIN), validateAddFaq, AiChatbotController.addFaq);
router.post('/faqs', authorizeRoles(ROLES.ADMIN), validateAddFaq, AiChatbotController.addFaq);

export default router;
