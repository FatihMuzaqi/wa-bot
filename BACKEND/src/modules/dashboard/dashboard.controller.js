import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import DashboardService from './dashboard.service.js';

export const overview = asyncHandler(async (_req, res) => (
  successResponse(res, await DashboardService.getDashboard(), 'Dashboard loaded')
));

export const summary = asyncHandler(async (_req, res) => (
  successResponse(res, await DashboardService.getSummary(), 'Dashboard summary loaded')
));

export const analytics = asyncHandler(async (_req, res) => (
  successResponse(res, await DashboardService.getAnalytics(), 'Dashboard analytics loaded')
));

export const trends = asyncHandler(async (_req, res) => (
  successResponse(res, {
    messageTrend: await DashboardService.getMessageTrend(),
    handlingTrend: await DashboardService.getHandlingTrend(),
  }, 'Dashboard trends loaded')
));

export const activity = asyncHandler(async (_req, res) => (
  successResponse(res, await DashboardService.getRecentActivity(), 'Dashboard activity loaded')
));

export const health = asyncHandler(async (_req, res) => (
  successResponse(res, DashboardService.getSystemHealth(), 'System health loaded')
));

export default { overview, summary, analytics, trends, activity, health };
