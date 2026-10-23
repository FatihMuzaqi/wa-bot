import { Router } from 'express';
import authenticate from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { ROLES } from '../../constants/roles.js';
import BotMenusController from './botMenus.controller.js';
import {
  validateCreateItem,
  validateCreateMenu,
  validateDeleteItem,
  validateMenuId,
  validateReorderItems,
  validateUpdateItem,
  validateUpdateMenu,
} from './botMenus.validation.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', BotMenusController.list);
router.get('/default', BotMenusController.defaultMenu);
router.post('/', validateCreateMenu, BotMenusController.create);
router.get('/:id', validateMenuId, BotMenusController.detail);
router.patch('/:id', validateUpdateMenu, BotMenusController.update);
router.delete('/:id', validateMenuId, BotMenusController.remove);

router.post('/:id/items', validateCreateItem, BotMenusController.createItem);
router.patch('/:id/items/:itemId', validateUpdateItem, BotMenusController.updateItem);
router.delete('/:id/items/:itemId', validateDeleteItem, BotMenusController.deleteItem);
router.patch('/:id/reorder', validateReorderItems, BotMenusController.reorderItems);

export default router;
