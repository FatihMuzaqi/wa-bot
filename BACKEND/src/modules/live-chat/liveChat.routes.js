import { Router } from "express";
import LiveChatController from "./liveChat.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import { ROLES } from "../../constants/roles.js";
import {
  validateAssignAgent,
  validateChatId,
  validateChatList,
  validateSendMessage,
  validateTransferAgent,
} from "./liveChat.validation.js";

const router = Router();
router.use((req, res, next) => {
  console.log("LIVE CHAT ROUTER HIT:", req.method, req.originalUrl);
  next();
});

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.AGENT));

router.get("/", validateChatList, LiveChatController.getChatList);
router.get(
  "/:chatId/messages",
  validateChatId,
  LiveChatController.getChatMessages,
);
router.get("/:chatId", validateChatId, LiveChatController.getChatDetail);
router.post(
  "/:chatId/messages",
  validateSendMessage,
  LiveChatController.sendMessage,
);
router.post(
  "/:chatId/send",
  validateSendMessage,
  LiveChatController.sendMessage,
);
router.post("/:chatId/read", validateChatId, LiveChatController.markChatAsRead);
router.post(
  "/:chatId/assign",
  validateAssignAgent,
  LiveChatController.assignAgent,
);
router.post("/:chatId/take-over", validateChatId, LiveChatController.takeOver);
router.post("/:chatId/takeover", validateChatId, LiveChatController.takeOver);
router.post(
  "/:chatId/transfer",
  validateTransferAgent,
  LiveChatController.transferChat,
);
router.post("/:chatId/close", validateChatId, LiveChatController.closeChat);

export default router;
