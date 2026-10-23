import { Router } from 'express';
import BotEngineController from './botEngine.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  validateExecute,
  validateQueue,
  validateTestMatch,
} from './botEngine.validation.js';

const router = Router();

router.use(authenticate);

router.post('/execute', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateExecute, BotEngineController.execute);
router.post('/queue', authorizeRoles(ROLES.ADMIN, ROLES.AGENT), validateQueue, BotEngineController.enqueue);
router.get('/queue/status', authorizeRoles(ROLES.ADMIN), BotEngineController.queueStatus);
router.post('/test', authorizeRoles(ROLES.ADMIN), validateTestMatch, BotEngineController.testMatch);

export default router;
