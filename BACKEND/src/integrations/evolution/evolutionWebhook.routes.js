import { Router } from 'express';
import EvolutionWebhookController from './evolutionWebhook.controller.js';

const router = Router();

router.post('/', EvolutionWebhookController.receive);
router.post('/message-upsert', EvolutionWebhookController.receiveMessageUpsert);
router.post('/messages-upsert', EvolutionWebhookController.receiveMessageUpsert);
router.post('/messages-update', EvolutionWebhookController.receiveMessagesUpdate);
router.post('/contacts-update', EvolutionWebhookController.receiveContactsUpdate);
router.post('/connection-update', EvolutionWebhookController.receiveConnectionUpdate);
router.post('/qr-updated', EvolutionWebhookController.receiveQrUpdated);
router.post('/:eventType', EvolutionWebhookController.receive);

export default router;
