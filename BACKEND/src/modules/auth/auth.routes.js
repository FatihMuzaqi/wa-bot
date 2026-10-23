import { Router } from 'express';
import AuthController from './auth.controller.js';
import {
  validateChangePassword,
  validateLogin,
  validateLogout,
  validateRefreshToken,
} from './auth.validation.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validateLogin, AuthController.login);
router.post('/logout', validateLogout, AuthController.logout);
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);
router.get('/profile', authenticate, AuthController.getProfile);
router.patch('/change-password', authenticate, validateChangePassword, AuthController.changePassword);

export default router;
