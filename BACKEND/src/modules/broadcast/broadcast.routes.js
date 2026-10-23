import { Router } from 'express';
import BroadcastController from './broadcast.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  validateBroadcastId,
  validateCreateCampaign,
  validateDeliveryTracking,
  validateScheduleCampaign,
} from './broadcast.validation.js';
import { uploadBroadcastExcel } from './broadcastUpload.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', BroadcastController.listBroadcasts);
router.post('/', validateCreateCampaign, BroadcastController.createCampaign);
router.post('/import-excel', uploadBroadcastExcel, BroadcastController.importExcel);
router.get('/queue/status', BroadcastController.queueStatus);
router.post('/delivery-status', validateDeliveryTracking, BroadcastController.updateDeliveryStatus);
router.get('/:broadcastId', validateBroadcastId, BroadcastController.getBroadcast);
router.patch('/:broadcastId', validateBroadcastId, BroadcastController.updateCampaign);
router.delete('/:broadcastId', validateBroadcastId, BroadcastController.deleteCampaign);
router.post('/:broadcastId/send-now', validateBroadcastId, BroadcastController.startCampaign);
router.post('/:broadcastId/cancel', validateBroadcastId, BroadcastController.cancelCampaign);
router.get('/:broadcastId/recipients', validateBroadcastId, BroadcastController.getRecipients);
router.get('/:broadcastId/logs', validateBroadcastId, BroadcastController.getLogs);
router.post('/:broadcastId/schedule', validateScheduleCampaign, BroadcastController.scheduleCampaign);
router.post('/:broadcastId/start', validateBroadcastId, BroadcastController.startCampaign);
router.post('/:broadcastId/retry-failed', validateBroadcastId, BroadcastController.retryFailed);

export default router;
