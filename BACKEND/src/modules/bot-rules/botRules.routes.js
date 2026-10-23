import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import BotRulesController from './botRules.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', BotRulesController.list);
router.post('/', BotRulesController.create);
router.get('/:ruleId', BotRulesController.detail);
router.patch('/:ruleId', BotRulesController.update);
router.delete('/:ruleId', BotRulesController.remove);

export default router;
