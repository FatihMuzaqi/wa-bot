import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import SettingsService from './settings.service.js';

export const list = asyncHandler(async (req, res) => (
  successResponse(res, await SettingsService.list(req.query), 'Settings loaded')
));

export const get = asyncHandler(async (req, res) => (
  successResponse(res, await SettingsService.get(req.params.key), 'Setting loaded')
));

export const upsert = asyncHandler(async (req, res) => (
  successResponse(res, await SettingsService.upsert(req.user, req.body), 'Setting saved')
));

export const update = asyncHandler(async (req, res) => (
  successResponse(res, await SettingsService.update(req.user, req.params.key, req.body), 'Setting updated')
));

export default { list, get, upsert, update };
