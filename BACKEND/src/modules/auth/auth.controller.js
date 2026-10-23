import { AuthService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

export const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body, requestMeta(req));
  return successResponse(res, result, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  await AuthService.logout(req.body.refreshToken);
  return successResponse(res, null, 'Logout successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await AuthService.refresh(req.body.refreshToken, requestMeta(req));
  return successResponse(res, result, 'Token refreshed');
});

export const changePassword = asyncHandler(async (req, res) => {
  await AuthService.changePassword(req.user.id, req.body);
  return successResponse(res, null, 'Password changed successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await AuthService.getProfile(req.user.id);
  return successResponse(res, profile, 'Profile loaded');
});

export default {
  login,
  logout,
  refreshToken,
  changePassword,
  getProfile,
};
