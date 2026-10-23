import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import SettingsController from './settings.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', SettingsController.list);
router.post('/', SettingsController.upsert);
router.get('/:key', SettingsController.get);
router.patch('/:key', SettingsController.update);

export default router;
