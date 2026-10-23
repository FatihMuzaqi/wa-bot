import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import DashboardController from './dashboard.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.AGENT));

router.get('/', DashboardController.overview);
router.get('/summary', DashboardController.summary);
router.get('/analytics', DashboardController.analytics);
router.get('/trends', DashboardController.trends);
router.get('/activity', DashboardController.activity);
router.get('/health', DashboardController.health);

export default router;
