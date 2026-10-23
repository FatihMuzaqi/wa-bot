import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import BotRulesService from './botRules.service.js';

export const list = asyncHandler(async (req, res) => (
  successResponse(res, await BotRulesService.list(req.query), 'Bot rules loaded')
));

export const detail = asyncHandler(async (req, res) => (
  successResponse(res, await BotRulesService.detail(req.params.ruleId), 'Bot rule loaded')
));

export const create = asyncHandler(async (req, res) => (
  successResponse(res, await BotRulesService.create(req.user, req.body), 'Bot rule created', 201)
));

export const update = asyncHandler(async (req, res) => (
  successResponse(res, await BotRulesService.update(req.params.ruleId, req.body), 'Bot rule updated')
));

export const remove = asyncHandler(async (req, res) => (
  successResponse(res, await BotRulesService.remove(req.params.ruleId), 'Bot rule deleted')
));

export default { list, detail, create, update, remove };
