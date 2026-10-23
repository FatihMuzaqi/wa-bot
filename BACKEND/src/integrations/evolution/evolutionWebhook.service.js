import crypto from "node:crypto";
import { UniqueConstraintError } from "sequelize";
import models from "../../database/models/index.js";
import ChatRepository from "../../modules/live-chat/repositories/chat.repository.js";
import BotEngineQueue from "../../modules/bot-engine/botEngine.queue.js";
import SocketService from "../../sockets/socket.service.js";
import ApiError from "../../utils/ApiError.js";

const { Contact, EvolutionWebhookEvent, Message } = models;

const SUPPORTED_EVENTS = new Set([
  "messages.upsert",
  "messages.update",
  "contacts.update",
  "chats.update",
  "connection.update",
  "qr.updated",
]);

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const parseJsonValue = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

const NOISY_EVOLUTION_FIELDS = new Set([
  "messageContextInfo",
  "senderKeyDistributionMessage",
  "protocolMessage",
  "deviceListMetadata",
  "messageSecret",
]);

const isBufferLikeNumericObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.type === "Buffer" && Array.isArray(value.data)) return true;

  const keys = Object.keys(value);
  return (
    keys.length > 32 &&
    keys.every((key) => /^\d+$/.test(key)) &&
    keys.every((key) => typeof value[key] === "number")
  );
};

export const sanitizeEvolutionPayload = (value, depth = 0) => {
  if (value === null || value === undefined) return value;
  if (Buffer.isBuffer(value)) {
    return { sanitized: true, type: "buffer", length: value.length };
  }
  if (typeof value !== "object") return value;
  if (isBufferLikeNumericObject(value)) {
    const length = Array.isArray(value.data) ? value.data.length : Object.keys(value).length;
    return { sanitized: true, type: "buffer_like_numeric_object", length };
  }
  if (depth >= 12) return { sanitized: true, reason: "max_depth_reached" };

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeEvolutionPayload(item, depth + 1));
  }

  return Object.entries(value).reduce((payload, [key, item]) => {
    if (NOISY_EVOLUTION_FIELDS.has(key)) return payload;
    payload[key] = sanitizeEvolutionPayload(item, depth + 1);
    return payload;
  }, {});
};

const getEventType = (payload, fallbackEventType = null) => {
  const eventType = firstDefined(
    payload?.event,
    payload?.type,
    fallbackEventType,
    "unknown",
  );
  return SUPPORTED_EVENTS.has(eventType) ? eventType : "unknown";
};

const getInstanceName = (payload) =>
  firstDefined(
    payload?.instance,
    payload?.instanceName,
    payload?.data?.instance,
    payload?.data?.instanceName,
  );

const getExternalMessageId = (payload) =>
  firstDefined(
    payload?.data?.key?.id,
    payload?.data?.message?.key?.id,
    payload?.data?.messages?.[0]?.key?.id,
    payload?.data?.id,
    payload?.message?.key?.id,
    payload?.key?.id,
  );

const normalizeWhatsAppJid = (value) => {
  if (!value || typeof value !== "string") return null;
  return value.includes("@") ? value : `${value}@s.whatsapp.net`;
};

const normalizePhone = (value) => {
  if (!value || typeof value !== "string") return null;
  const jidUser = value.split("@")[0];
  const phone = jidUser.split(":")[0].replace(/\D/g, "");
  return phone || null;
};

const getIncomingMessageData = (payload) => {
  const data = payload?.data?.message ? payload.data : payload?.data;
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
};

const getMessageSenderJid = (messageData) => {
  const key = messageData?.key || messageData?.message?.key || {};
  if (key.fromMe) return null;

  return firstDefined(
    key.remoteJid,
    messageData?.remoteJid,
    key.participant,
    messageData?.participant,
    messageData?.remoteJid,
    messageData?.sender,
    messageData?.from,
  );
};

const getPushName = (value) =>
  firstDefined(
    value?.pushName,
    value?.pushname,
    value?.notifyName,
    value?.verifiedName,
    value?.name,
    value?.contact?.pushName,
    value?.contact?.name,
  );

const getProfilePictureUrl = (value) =>
  firstDefined(
    value?.profilePictureUrl,
    value?.profilePicUrl,
    value?.picture,
    value?.imgUrl,
    value?.avatar,
    value?.contact?.profilePictureUrl,
    value?.contact?.profilePicUrl,
  );

const getMessageContentNode = (messageData) =>
  messageData?.message || messageData?.data?.message || {};

const getMessageTimestamp = (messageData) => {
  const timestamp = firstDefined(
    messageData?.messageTimestamp,
    messageData?.timestamp,
    messageData?.dateTime,
    messageData?.message?.messageTimestamp,
  );

  if (!timestamp) return new Date();
  const numeric = Number(timestamp);
  if (!Number.isNaN(numeric)) {
    return new Date(numeric < 1000000000000 ? numeric * 1000 : numeric);
  }

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const detectMessageType = (messageData) => {
  const message = getMessageContentNode(messageData);
  if (message.imageMessage) return "image";
  if (message.audioMessage) return "audio";
  if (message.videoMessage) return "video";
  if (message.documentMessage) return "document";
  return "text";
};

const getTypedMessageNode = (messageData, messageType) => {
  const message = getMessageContentNode(messageData);
  return (
    {
      text: message.extendedTextMessage || message,
      image: message.imageMessage,
      audio: message.audioMessage,
      video: message.videoMessage,
      document: message.documentMessage,
    }[messageType] || message
  );
};

const getMessageContent = (messageData, messageType) => {
  const message = getMessageContentNode(messageData);
  const typed = getTypedMessageNode(messageData, messageType);

  if (messageType === "text") {
    return firstDefined(
      message.conversation,
      message.extendedTextMessage?.text,
      messageData?.text,
      messageData?.body,
      "",
    );
  }

  return firstDefined(
    typed?.caption,
    typed?.fileName,
    typed?.title,
    typed?.mimetype,
    "",
  );
};

const getMessageMediaUrl = (messageData, messageType) => {
  if (messageType === "text") return null;
  const typed = getTypedMessageNode(messageData, messageType);
  return (
    firstDefined(
      typed?.url,
      typed?.mediaUrl,
      typed?.fileUrl,
      typed?.directPath,
    ) || null
  );
};

const getMinimalMessageTimestamp = (messageData) => firstDefined(
  messageData?.messageTimestamp,
  messageData?.timestamp,
  messageData?.dateTime,
  messageData?.message?.messageTimestamp,
) || null;

const buildMinimalMessageMetadata = ({ messageData, messageType, externalMessageId, senderJid }) => ({
  source: "evolution_webhook",
  remoteJid: senderJid || firstDefined(messageData?.key?.remoteJid, messageData?.remoteJid) || null,
  messageId: externalMessageId || firstDefined(messageData?.key?.id, messageData?.id) || null,
  pushName: getPushName(messageData) || null,
  messageType,
  timestamp: getMinimalMessageTimestamp(messageData),
});

const buildContactPayload = ({
  jid,
  phone,
  pushName,
  profilePictureUrl,
  sourceEvent,
      raw,
}) => {
  const metadata = {
    sourceEvent,
    lastEvolutionSyncAt: new Date().toISOString(),
    evolution: {
      remoteJid: jid || null,
      pushName: pushName || null,
      profilePictureUrl: profilePictureUrl || null,
      ...(raw || {}),
    },
  };

  return {
    whatsapp_id: jid,
    phone,
    ...(pushName && { name: pushName }),
    ...(profilePictureUrl && { profile_picture_url: profilePictureUrl }),
    source: "whatsapp",
    status: "active",
    metadata,
  };
};

const upsertContactFromEvolution = async ({
  jid,
  pushName,
  profilePictureUrl,
  sourceEvent,
  raw,
}) => {
  const whatsappId = normalizeWhatsAppJid(jid);
  const phone = normalizePhone(whatsappId || jid);
  if (!phone) return null;

  const payload = buildContactPayload({
    jid: whatsappId,
    phone,
    pushName,
    profilePictureUrl,
    sourceEvent,
    raw,
  });

  const existing = await Contact.findOne({ where: { phone } });
  if (!existing) {
    return Contact.create(payload);
  }

  await existing.update({
    whatsapp_id: existing.whatsapp_id || payload.whatsapp_id,
    ...(pushName && { name: pushName }),
    ...(profilePictureUrl && { profile_picture_url: profilePictureUrl }),
    metadata: {
      ...parseJsonValue(existing.metadata),
      ...payload.metadata,
    },
  });

  return existing.reload();
};

const syncContactFromMessageUpsert = async (payload) => {
  const messageData = getIncomingMessageData(payload);
  const senderJid = getMessageSenderJid(messageData);
  if (!senderJid) return null;

  return upsertContactFromEvolution({
    jid: senderJid,
    pushName: getPushName(messageData),
    profilePictureUrl: getProfilePictureUrl(messageData),
    sourceEvent: "messages.upsert",
    raw: {
      messageId: firstDefined(messageData?.key?.id, messageData?.id) || null,
      timestamp: getMinimalMessageTimestamp(messageData),
    },
  });
};

const syncChatFromMessageUpsert = async (contact) => {
  if (!contact) return null;

  const now = new Date();
  const existingChat = await ChatRepository.findActiveChatByContactId(
    contact.id,
  );

  if (!existingChat) {
    const chat = await ChatRepository.createChat({
      contact_id: contact.id,
      assigned_agent_id: null,
      status: "bot",
      unread_count: 1,
      last_message_at: now,
      metadata: {
        source: "evolution_webhook",
        createdFrom: "messages.upsert",
      },
    });

    const savedChat = await ChatRepository.findChatById(chat.id);
    SocketService.emitChatNew(savedChat);
    return { chat: savedChat, created: true };
  }

  await existingChat.update({
    last_message_at: now,
    unread_count: Number(existingChat.unread_count || 0) + 1,
  });

  const chat = await ChatRepository.findChatById(existingChat.id);
  SocketService.emitChatUpdate(existingChat.id, {
    chat,
    reason: "inbound_message_received",
  });

  return { chat, created: false };
};

const getContactsUpdateItems = (payload) => {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.contacts)) return data.contacts;
  if (Array.isArray(payload?.contacts)) return payload.contacts;
  return [data || payload].filter(Boolean);
};

const syncContactsUpdate = async (payload) => {
  return [];
};

const syncContactForEvent = async (eventType, payload) => {
  if (eventType === "messages.upsert")
    return syncContactFromMessageUpsert(payload);
  return null;
};

const syncChatForEvent = async (eventType, syncedContact) => {
  if (eventType !== "messages.upsert") return null;
  return syncChatFromMessageUpsert(syncedContact);
};

const syncMessageFromMessageUpsert = async ({
  payload,
  instanceName,
  externalMessageId,
  syncedContact,
  syncedChat,
}) => {
  if (!syncedContact || !syncedChat?.chat || !externalMessageId) return null;

  const messageData = getIncomingMessageData(payload);
  const senderJid = getMessageSenderJid(messageData);
  if (!messageData || !senderJid) return null;

  const messageType = detectMessageType(messageData);
  const messageContent = getMessageContent(messageData, messageType);
  const supportedTypes = new Set([
    "text",
    "image",
    "audio",
    "video",
    "document",
  ]);
  if (!supportedTypes.has(messageType)) return null;

  const existingMessage = await Message.findOne({
    where: { evolution_message_id: externalMessageId },
  });
  if (existingMessage) return existingMessage;

  let message;
  try {
    message = await Message.create({
      chat_id: syncedChat.chat.id,
      contact_id: syncedContact.id,
      sender_user_id: null,
      sender_type: "contact",
      direction: "inbound",
      message_type: messageType,
      content: messageContent,
      media_url: getMessageMediaUrl(messageData, messageType),
      instance_name: instanceName || null,
      evolution_message_id: externalMessageId,
      message_timestamp: getMessageTimestamp(messageData),
      status: "received",
      metadata: buildMinimalMessageMetadata({
        messageData,
        messageType,
        externalMessageId,
        senderJid,
      }),
    });
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    message = await Message.findOne({ where: { evolution_message_id: externalMessageId } });
  }

  console.log("[EvolutionWebhook] senderJid:", senderJid);
  console.log("[EvolutionWebhook] contactId:", syncedContact.id);
  console.log("[EvolutionWebhook] chatId:", syncedChat.chat.id);
  console.log("[EvolutionWebhook] content:", messageContent);
  console.log("[EvolutionWebhook] inbound text:", messageType === "text" ? messageContent : `[${messageType}] ${messageContent || ""}`.trim());
  console.log("[EvolutionWebhook] message saved id:", message?.id || null);
  SocketService.emitMessageNew(syncedChat.chat.id, message);
  return message;
};

const syncMessageForEvent = async (eventType, options) => {
  if (eventType !== "messages.upsert") return null;
  return syncMessageFromMessageUpsert(options);
};

const findExistingInboundMessage = (eventType, externalMessageId) => {
  if (eventType !== "messages.upsert" || !externalMessageId) return Promise.resolve(null);
  return Message.findOne({ where: { evolution_message_id: externalMessageId } });
};

const buildSyncedStateFromExistingMessage = async (message) => {
  if (!message) return { syncedContact: null, syncedChat: null, syncedMessage: null };

  const [contact, chat] = await Promise.all([
    Contact.findByPk(message.contact_id),
    ChatRepository.findChatById(message.chat_id),
  ]);

  return {
    syncedContact: contact,
    syncedChat: chat ? { chat, created: false } : null,
    syncedMessage: message,
  };
};

const enqueueBotForInboundMessage = ({
  eventType,
  syncedChat,
  syncedMessage,
  instanceName,
}) => {
  if (eventType !== "messages.upsert") return null;
  if (!syncedChat?.chat || !syncedMessage) return null;
  if (!syncedMessage.content) return null;

  const botJob = BotEngineQueue.enqueue({
    chatId: syncedChat.chat.id,
    messageId: syncedMessage.id,
    text: syncedMessage.content,
    instanceName,
  });
  console.log("[EvolutionWebhook] bot job queued:", botJob);
  return botJob;
};

const getConnectionState = (payload) =>
  firstDefined(
    payload?.data?.state,
    payload?.data?.connection,
    payload?.state,
    payload?.connection,
  );

const getMessageUpdateState = (payload) =>
  firstDefined(
    payload?.data?.status,
    payload?.data?.update?.status,
    payload?.data?.messageStatus,
    payload?.status,
    payload?.messageStatus,
  );

const buildEventKey = (payload, eventType, instanceName, externalMessageId) => {
  const explicitId = firstDefined(
    payload?.id,
    payload?.eventId,
    payload?.event_id,
    payload?.data?.id,
  );

  const sourceKey = explicitId || externalMessageId;
  if (sourceKey && eventType === "messages.update") {
    const updateState =
      getMessageUpdateState(payload) ||
      sha256(stableStringify(payload?.data || payload));
    return `${eventType}:${instanceName || "default"}:${sourceKey}:${updateState}`;
  }

  if (sourceKey)
    return `${eventType}:${instanceName || "default"}:${sourceKey}`;

  return `${eventType}:${instanceName || "default"}:${sha256(stableStringify(payload))}`;
};

const verifyWebhookApiKey = (req) => {
  const configuredApiKey = process.env.EVOLUTION_API_KEY;
  if (!configuredApiKey) return;
  console.log("HEADER APIKEY:", req.get("apikey"));
  console.log("ENV APIKEY:", process.env.EVOLUTION_API_KEY);
  console.log(req.headers);

  const incomingApiKey = firstDefined(
    req.get("apikey"),
    req.get("x-api-key"),
    req.body?.apikey,
  );

  if (incomingApiKey !== configuredApiKey) {
    throw new ApiError(401, "Invalid Evolution webhook API key");
  }
};

export const normalizeWebhookPayload = (payload, fallbackEventType = null) => {
  const sanitizedPayload = sanitizeEvolutionPayload(payload);
  const eventType = getEventType(sanitizedPayload, fallbackEventType);
  const instanceName = getInstanceName(sanitizedPayload);
  const externalMessageId = getExternalMessageId(sanitizedPayload);
  const connectionState = getConnectionState(sanitizedPayload);

  return {
    eventKey: buildEventKey(
      sanitizedPayload,
      eventType,
      instanceName,
      externalMessageId,
    ),
    eventType,
    instanceName,
    externalMessageId,
    connectionState,
    payload: sanitizedPayload,
  };
};

export const storeWebhookEvent = async (req, fallbackEventType = null) => {
  // verifyWebhookApiKey(req);
  // console.log("EVENT:", req.body.event);

  // console.log(JSON.stringify(req.body, null, 2));

  const normalized = normalizeWebhookPayload(req.body, fallbackEventType);
  console.log("[EvolutionWebhook] event type:", normalized.eventType);
  console.log("[EvolutionWebhook] externalMessageId:", normalized.externalMessageId || null);

  let event = null;

  try {
    const [storedEvent, created] = await EvolutionWebhookEvent.findOrCreate({
      where: { event_key: normalized.eventKey },
      defaults: {
        event_key: normalized.eventKey,
        event_type: normalized.eventType,
        instance_name: normalized.instanceName || null,
        external_message_id: normalized.externalMessageId || null,
        connection_state: normalized.connectionState || null,
        payload: normalized.payload,
        received_at: new Date(),
        processed_at: null,
        failed_at: null,
        error_message: null,
      },
    });
    event = storedEvent;
    console.log("[EvolutionWebhook] event state:", created ? "created" : "duplicate");

    if (!created) {
      await event.increment("duplicate_count");
      await event.reload();
    }

    if (normalized.eventType !== "messages.upsert") {
      await event.update({
        processed_at: event.processed_at || new Date(),
        failed_at: null,
        error_message: null,
      });

      return {
        event,
        created,
        duplicate: !created,
        syncedContact: null,
        syncedChat: null,
        syncedMessage: null,
        botJob: null,
      };
    }

    const existingMessage = await findExistingInboundMessage(
      normalized.eventType,
      normalized.externalMessageId,
    );
    console.log("[EvolutionWebhook] existing message found:", Boolean(existingMessage));

    const shouldProcess = (
      created ||
      !event.processed_at ||
      (normalized.eventType === "messages.upsert" && !existingMessage)
    );

    let syncedContact = null;
    let syncedChat = null;
    let syncedMessage = null;
    let botJob = null;

    try {
      if (shouldProcess && !existingMessage) {
        syncedContact = await syncContactForEvent(normalized.eventType, normalized.payload);
        syncedChat = await syncChatForEvent(normalized.eventType, syncedContact);
        syncedMessage = await syncMessageForEvent(normalized.eventType, {
          payload: normalized.payload,
          instanceName: normalized.instanceName,
          externalMessageId: normalized.externalMessageId,
          syncedContact,
          syncedChat,
        });
      } else if (existingMessage) {
        ({ syncedContact, syncedChat, syncedMessage } = await buildSyncedStateFromExistingMessage(existingMessage));
      }

      console.log("[EvolutionWebhook] syncedMessage id:", syncedMessage?.id || null);

      if (!syncedMessage) {
        throw new Error("messages.upsert did not produce syncedMessage");
      }

      if (shouldProcess) {
        SocketService.emitWebhookMessageSaved({
          contact: syncedContact,
          chat: syncedChat?.chat,
          message: syncedMessage,
        });
      }
      const shouldQueueBot = syncedMessage && (created || !event.processed_at || !existingMessage);
      botJob = shouldQueueBot
        ? enqueueBotForInboundMessage({
          eventType: normalized.eventType,
          syncedChat,
          syncedMessage,
          instanceName: normalized.instanceName,
        })
        : null;
      if (!botJob) console.log("[EvolutionWebhook] bot job queued:", null);

      await event.update({
        processed_at: new Date(),
        failed_at: null,
        error_message: null,
      });
    } catch (syncError) {
      console.error("WEBHOOK SYNC ERROR:", syncError.message);
      await event.update({
        failed_at: new Date(),
        error_message: syncError.message,
      });

      return {
        event,
        created,
        duplicate: !created,
        syncedContact,
        syncedChat,
        syncedMessage,
        botJob,
      };
    }

    return {
      event,
      created,
      duplicate: !created,
      syncedContact,
      syncedChat,
      syncedMessage,
      botJob,
    };
  } catch (error) {
    console.error("WEBHOOK STORE ERROR:", error.message);
    if (event) {
      await event.update({
        failed_at: new Date(),
        error_message: error.message,
      });
    }

    if (!(error instanceof UniqueConstraintError)) throw error;

    event = await EvolutionWebhookEvent.findOne({
      where: { event_key: normalized.eventKey },
    });

    if (event) {
      await event.increment("duplicate_count");
      await event.reload();
    }

    return {
      event,
      created: false,
      duplicate: true,
      syncedContact: null,
      syncedChat: null,
      syncedMessage: null,
      botJob: null,
    };
  }
};

export const EvolutionWebhookService = {
  normalizeWebhookPayload,
  storeWebhookEvent,
  syncContactForEvent,
  syncChatForEvent,
  syncMessageForEvent,
};

export default EvolutionWebhookService;
