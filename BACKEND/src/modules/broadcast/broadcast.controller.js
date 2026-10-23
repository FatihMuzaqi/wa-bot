import BroadcastService from "./broadcast.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const listBroadcasts = asyncHandler(async (req, res) => {
  const data = await BroadcastService.listBroadcasts(req.query);
  return successResponse(res, data, "Broadcasts loaded");
});

export const getBroadcast = asyncHandler(async (req, res) => {
  const data = await BroadcastService.getBroadcast(req.params.broadcastId);
  return successResponse(res, data, "Broadcast loaded");
});

export const createCampaign = asyncHandler(async (req, res) => {
  console.log(
    "[BroadcastController] create payload:",
    JSON.stringify(req.body, null, 2),
  );

  const payload = {
    name: req.body.name,
    message_type: req.body.message_type || req.body.messageType || "text",
    message_payload: req.body.message_payload || req.body.messagePayload,
    audience_filter:
      req.body.audience_filter || req.body.audienceFilter || null,
    scheduled_at: req.body.scheduled_at || req.body.scheduledAt || null,
    status:
      req.body.scheduledAt || req.body.scheduled_at ? "scheduled" : "draft",
    metadata: req.body.metadata || null,
  };

  console.log(
    "[BroadcastController] normalized payload:",
    JSON.stringify(payload, null, 2),
  );

  try {
    const data = await BroadcastService.createCampaign(req.user, payload);
    return successResponse(res, data, "Broadcast campaign created", 201);
  } catch (error) {
    console.error("[BroadcastController] create error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      errors: error.errors,
      parent: error.parent,
    });
    throw error;
  }
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const data = await BroadcastService.updateCampaign(
    req.params.broadcastId,
    req.body,
  );
  return successResponse(res, data, "Broadcast campaign updated");
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const data = await BroadcastService.deleteCampaign(req.params.broadcastId);
  return successResponse(res, data, "Broadcast campaign deleted");
});

export const importExcel = asyncHandler(async (req, res) => {
  const data = await BroadcastService.importExcel(req.file);
  return successResponse(res, data, "Broadcast contacts imported");
});

export const scheduleCampaign = asyncHandler(async (req, res) => {
  const scheduledAt = req.body.scheduledAt || req.body.scheduled_at;

  const data = await BroadcastService.scheduleCampaign(
    req.params.broadcastId,
    scheduledAt,
  );

  return successResponse(res, data, "Broadcast campaign scheduled");
});

export const startCampaign = asyncHandler(async (req, res) => {
  const data = await BroadcastService.sendNow(req.params.broadcastId);
  return successResponse(res, data, "Broadcast campaign sent", 202);
});

export const cancelCampaign = asyncHandler(async (req, res) => {
  const data = await BroadcastService.cancelCampaign(req.params.broadcastId);
  return successResponse(res, data, "Broadcast campaign cancelled");
});

export const retryFailed = asyncHandler(async (req, res) => {
  const data = await BroadcastService.retryFailed(req.params.broadcastId);
  return successResponse(res, data, "Failed broadcast recipients queued", 202);
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const data = await BroadcastService.updateDeliveryStatus(req.body);
  return successResponse(res, data, "Broadcast delivery status updated");
});

export const queueStatus = asyncHandler(async (_req, res) => {
  const data = BroadcastService.queueStatus();
  return successResponse(res, data, "Broadcast queue status loaded");
});

export const getRecipients = asyncHandler(async (req, res) => {
  const data = await BroadcastService.getRecipients(req.params.broadcastId);
  return successResponse(res, data, "Broadcast recipients loaded");
});

export const getLogs = asyncHandler(async (req, res) => {
  const data = await BroadcastService.getLogs(req.params.broadcastId);
  return successResponse(res, data, "Broadcast logs loaded");
});

export default {
  listBroadcasts,
  getBroadcast,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  importExcel,
  scheduleCampaign,
  startCampaign,
  cancelCampaign,
  retryFailed,
  updateDeliveryStatus,
  queueStatus,
  getRecipients,
  getLogs,
};
