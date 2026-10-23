import BotExecutionService from './botExecution.service.js';
import BotEngineQueue from './botEngine.queue.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

export const execute = asyncHandler(async (req, res) => {
  const result = await BotExecutionService.execute(req.body);
  return successResponse(res, result, 'Bot engine executed');
});

export const testMatch = asyncHandler(async (req, res) => {
  const result = await BotExecutionService.testMatch(req.body);
  return successResponse(res, {
    matched: Boolean(result.rule),
    rule: result.rule,
    match: result.match,
    diagnostics: result.diagnostics,
  }, 'Bot matcher tested');
});

export const enqueue = asyncHandler(async (req, res) => {
  const result = BotEngineQueue.enqueue(req.body);
  return successResponse(res, result, result.duplicate ? 'Bot job already queued' : 'Bot job queued', 202);
});

export const queueStatus = asyncHandler(async (_req, res) => {
  const result = BotEngineQueue.getStatus();
  return successResponse(res, result, 'Bot queue status loaded');
});

export default {
  execute,
  testMatch,
  enqueue,
  queueStatus,
};
