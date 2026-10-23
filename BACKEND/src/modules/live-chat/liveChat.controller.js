import LiveChatService from "./liveChat.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const getChatList = asyncHandler(async (req, res) => {
  const data = await LiveChatService.getChatList(req.user, req.query);
  return successResponse(res, data, "Chat list loaded");
});

export const getChatDetail = asyncHandler(async (req, res) => {
  const data = await LiveChatService.getChatDetail(req.user, req.params.chatId);
  return successResponse(res, data, "Chat detail loaded");
});

export const getChatMessages = asyncHandler(async (req, res) => {
  const data = await LiveChatService.getChatMessages(
    req.user,
    req.params.chatId,
    req.query,
  );
  return successResponse(res, data, "Chat messages loaded");
});

export const sendMessage = asyncHandler(async (req, res) => {
  console.log("CONTROLLER SEND MESSAGE:", {
    chatId: req.params.chatId,
    body: req.body,
    user: req.user,
  });

  const data = await LiveChatService.sendMessage(
    req.user,
    req.params.chatId,
    req.body,
  );
  return successResponse(res, data, "Message sent", 201);
});

export const markChatAsRead = asyncHandler(async (req, res) => {
  const data = await LiveChatService.markChatAsRead(
    req.user,
    req.params.chatId,
  );
  return successResponse(res, data, "Chat marked as read");
});

export const assignAgent = asyncHandler(async (req, res) => {
  const data = await LiveChatService.assignAgent(
    req.user,
    req.params.chatId,
    req.body.agentId,
  );
  return successResponse(res, data, "Agent assigned");
});

export const takeOver = asyncHandler(async (req, res) => {
  const data = await LiveChatService.takeOver(req.user, req.params.chatId);
  return successResponse(res, data, "Chat taken over");
});

export const transferChat = asyncHandler(async (req, res) => {
  const data = await LiveChatService.transferChat(
    req.user,
    req.params.chatId,
    req.body.agentId,
    req.body.note || null,
  );
  return successResponse(res, data, "Chat transferred");
});

export const closeChat = asyncHandler(async (req, res) => {
  const data = await LiveChatService.closeChat(req.user, req.params.chatId);
  return successResponse(res, data, "Chat closed");
});

export default {
  getChatList,
  getChatDetail,
  getChatMessages,
  sendMessage,
  markChatAsRead,
  assignAgent,
  takeOver,
  transferChat,
  closeChat,
};
