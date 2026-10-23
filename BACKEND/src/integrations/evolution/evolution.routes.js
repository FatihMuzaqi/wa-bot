import { Router } from 'express';
import EvolutionController from './evolution.controller.js';
import {
  validateCreateInstance,
  validateInstanceParam,
  validateSendAudio,
  validateSendDocument,
  validateSendImage,
  validateSendText,
  validateSendVideo,
} from './evolution.validator.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post('/instances', authorizeRoles(ROLES.ADMIN), validateCreateInstance, EvolutionController.createInstance);
router.delete('/instances/:instanceName?', authorizeRoles(ROLES.ADMIN), validateInstanceParam, EvolutionController.deleteInstance);
router.post('/instances/:instanceName?/restart', authorizeRoles(ROLES.ADMIN), validateInstanceParam, EvolutionController.restartInstance);
router.get('/instances/:instanceName?/qr', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateInstanceParam, EvolutionController.getQrCode);
router.get('/instances/:instanceName?/status', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateInstanceParam, EvolutionController.getConnectionStatus);

router.post('/messages/text', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateSendText, EvolutionController.sendText);
router.post('/messages/image', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateSendImage, EvolutionController.sendImage);
router.post('/messages/document', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateSendDocument, EvolutionController.sendDocument);
router.post('/messages/audio', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateSendAudio, EvolutionController.sendAudio);
router.post('/messages/video', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateSendVideo, EvolutionController.sendVideo);

export default router;
