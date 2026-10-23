import EvolutionService from "../../integrations/evolution/evolution.service.js";
import models, { sequelize } from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";
import BroadcastRepository from "./repositories/broadcast.repository.js";
import BroadcastQueue from "./broadcast.queue.js";
import { parseExcelContacts } from "./broadcastImport.service.js";
import "./broadcastSender.service.js";

const { Broadcast } = models;
const serializePagination = ({ rows, count }, { page, limit }) => ({
  rows,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractEvolutionMessageId = (response) =>
  response?.key?.id ||
  response?.message?.key?.id ||
  response?.data?.key?.id ||
  response?.id ||
  null;

export const renderTemplate = (template, contact) =>
  String(template || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    if (key === "name") return contact.name || "Pelanggan";
    if (key === "phone") return contact.phone || "";
    if (key === "date") return new Date().toLocaleDateString("id-ID");
    if (key === "email") return contact.email || "";
    return contact.metadata?.[key] || "";
  });

export const importExcel = (file) => {
  if (!file) throw new ApiError(422, "Excel file is required");
  return parseExcelContacts(file);
};

const uniqueContacts = (contacts) => {
  const seen = new Set();
  return contacts.filter((contact) => {
    if (!contact?.phone || seen.has(contact.phone)) return false;
    seen.add(contact.phone);
    return true;
  });
};

const parseJsonField = (value, fallback = {}) => {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("[Broadcast] JSON parse error:", error);
    return fallback;
  }
};

export const resolveRecipients = async (broadcast) => {
  console.log("[Broadcast] resolveRecipients broadcast:", {
    id: broadcast.id,
    audience_filter: broadcast.audience_filter,
    raw: broadcast.toJSON?.(),
  });

  const existing = await BroadcastRepository.countRecipients(broadcast.id);
  console.log("[Broadcast] existing recipients:", existing);

  if (existing > 0) {
    return BroadcastRepository.findRecipientsByBroadcast(broadcast.id);
  }

  let audienceFilter = broadcast.audience_filter || {};

  if (typeof audienceFilter === "string") {
    try {
      audienceFilter = JSON.parse(audienceFilter);
    } catch (error) {
      console.error("[Broadcast] invalid audience_filter json", error);
      audienceFilter = {};
    }
  }
  const type = audienceFilter.type || "selected_contacts";

  console.log("[Broadcast] audience type:", type);
  console.log("[Broadcast] excel contacts:", audienceFilter.contacts);
  let contacts = [];
  const invalid = [];

  if (type === "all_contacts") {
    contacts = await BroadcastRepository.findAllContacts();
  } else if (type === "selected_contacts") {
    contacts = await BroadcastRepository.findContactsByIds(
      audienceFilter.contactIds || audienceFilter.contact_ids || [],
    );
  } else if (type === "chat_status") {
    contacts = await BroadcastRepository.findContactsByChatStatus(
      audienceFilter.status || "pending",
    );
  } else if (type === "excel_import") {
    for (const row of audienceFilter.contacts || []) {
      console.log("[Broadcast] excel row:", row);

      if (!row.phone) {
        invalid.push({ ...row, reason: "Missing phone number" });
        continue;
      }

      const result = await BroadcastRepository.findOrCreateContact({
        name: row.name || null,
        phone: row.phone,
      });

      const contact = Array.isArray(result) ? result[0] : result;

      console.log("[Broadcast] contact result:", {
        isArray: Array.isArray(result),
        id: contact?.id,
        name: contact?.name,
        phone: contact?.phone,
        raw: contact?.toJSON?.(),
      });

      if (contact?.phone) {
        contacts.push(contact);
      } else {
        invalid.push({ ...row, reason: "Contact create failed" });
      }
    }
  } else {
    contacts = await BroadcastRepository.findContactsBySegment(audienceFilter);
  }

  const deduped = uniqueContacts(contacts);
  if (!deduped.length)
    throw new ApiError(422, "No valid recipients matched the audience");

  await sequelize.transaction(async (transaction) => {
    await BroadcastRepository.createRecipients(
      deduped.map((contact) => ({
        broadcast_id: broadcast.id,
        contact_id: contact.id,
        status: "pending",
      })),
      { transaction },
    );

    await BroadcastRepository.updateBroadcast(
      broadcast,
      {
        metadata: {
          ...(broadcast.metadata || {}),
          total_recipients: deduped.length,
          total_valid: deduped.length,
          total_invalid: invalid.length,
          audienceType: type,
        },
      },
      { transaction },
    );

    await BroadcastRepository.createBroadcastLog(
      {
        broadcast_id: broadcast.id,
        event_type: "recipients_resolved",
        payload: {
          audienceType: type,
          totalRecipients: deduped.length,
          invalid,
        },
      },
      { transaction },
    );
  });

  return BroadcastRepository.findRecipientsByBroadcast(broadcast.id);
};

export const listBroadcasts = async (filters = {}) => {
  const page = Math.max(Number(filters.page || 1), 1);
  const limit = Math.min(Math.max(Number(filters.limit || 20), 1), 100);
  const result = await BroadcastRepository.findBroadcasts({
    page,
    limit,
    status: filters.status,
  });
  return serializePagination(result, { page, limit });
};

export const getBroadcast = async (broadcastId) => {
  const broadcast = await BroadcastRepository.findBroadcastById(broadcastId);
  if (!broadcast) throw new ApiError(404, "Broadcast not found");
  return broadcast;
};

export const createCampaign = async (user, payload) => {
  const broadcast = await Broadcast.create({
    name: payload.name,
    message_type: payload.message_type || "text",
    message_payload: payload.message_payload,
    audience_filter: payload.audience_filter || null,
    status: payload.status || "draft",
    scheduled_at: payload.scheduled_at || null,
    created_by: user?.id || null,
    metadata: payload.metadata || null,
  });

  return broadcast;
};

export const updateCampaign = async (broadcastId, payload) => {
  const broadcast = await getBroadcast(broadcastId);
  if (["sending", "completed"].includes(broadcast.status)) {
    throw new ApiError(
      409,
      `Cannot update broadcast with status ${broadcast.status}`,
    );
  }

  await BroadcastRepository.updateBroadcast(broadcast, {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.messageType !== undefined && {
      message_type: payload.messageType,
    }),
    ...(payload.messagePayload !== undefined && {
      message_payload: payload.messagePayload,
    }),
    ...(payload.audienceFilter !== undefined && {
      audience_filter: payload.audienceFilter,
    }),
    ...(payload.scheduledAt !== undefined && {
      scheduled_at: payload.scheduledAt || null,
      status: payload.scheduledAt ? "scheduled" : broadcast.status,
    }),
  });

  await BroadcastRepository.createBroadcastLog({
    broadcast_id: broadcast.id,
    event_type: "campaign_updated",
    payload,
  });

  return getBroadcast(broadcast.id);
};

export const deleteCampaign = async (broadcastId) => {
  const broadcast = await getBroadcast(broadcastId);
  await broadcast.destroy();
  return { id: Number(broadcastId) };
};

export const cancelCampaign = async (broadcastId) => {
  const broadcast = await getBroadcast(broadcastId);
  if (["completed", "cancelled"].includes(broadcast.status)) return broadcast;
  await BroadcastRepository.updateBroadcast(broadcast, { status: "cancelled" });
  await BroadcastRepository.createBroadcastLog({
    broadcast_id: broadcast.id,
    event_type: "campaign_cancelled",
    payload: {},
  });
  return getBroadcast(broadcast.id);
};

export const scheduleCampaign = async (broadcastId, scheduledAt) => {
  const broadcast = await getBroadcast(broadcastId);
  if (["sending", "completed", "cancelled"].includes(broadcast.status)) {
    throw new ApiError(
      409,
      `Cannot schedule broadcast with status ${broadcast.status}`,
    );
  }

  await BroadcastRepository.updateBroadcast(broadcast, {
    status: "scheduled",
    scheduled_at: scheduledAt,
  });

  await BroadcastRepository.createBroadcastLog({
    broadcast_id: broadcast.id,
    event_type: "campaign_scheduled",
    payload: { scheduledAt },
  });

  return getBroadcast(broadcast.id);
};

const saveOutboundMessage = async ({ recipient, text, evolutionMessageId }) => {
  const chat = await BroadcastRepository.findChatByContactId(
    recipient.contact_id,
  );
  if (!chat) return null;
  return BroadcastRepository.createMessage({
    chat_id: chat.id,
    contact_id: recipient.contact_id,
    sender_type: "system",
    direction: "outbound",
    message_type: "text",
    content: text,
    status: evolutionMessageId ? "sent" : "queued",
    evolution_message_id: evolutionMessageId,
    message_timestamp: new Date(),
    metadata: {
      source: "broadcast",
      broadcastId: recipient.broadcast_id,
      broadcastRecipientId: recipient.id,
    },
  });
};

const sendRecipient = async ({ broadcast, recipient }) => {
  if (!recipient.contact?.phone) {
    await BroadcastRepository.updateRecipient(recipient, {
      status: "skipped",
      error_message: "Missing phone number",
    });
    return "skipped";
  }

  const messagePayload = parseJsonField(broadcast.message_payload);

  const text = renderTemplate(
    messagePayload.text || messagePayload.message,
    recipient.contact,
  );

  try {
    const response = await EvolutionService.sendText({
      instanceName:
        messagePayload.instanceName || process.env.EVOLUTION_INSTANCE,
      number: recipient.contact.phone,
      text,
    });
    const evolutionMessageId = extractEvolutionMessageId(response);
    const message = await saveOutboundMessage({
      recipient,
      text,
      evolutionMessageId,
    });

    await BroadcastRepository.updateRecipient(recipient, {
      status: "sent",
      message_id: message?.id || null,
      evolution_message_id: evolutionMessageId,
      sent_at: new Date(),
      error_message: null,
    });

    await BroadcastRepository.createBroadcastLog({
      broadcast_id: broadcast.id,
      broadcast_recipient_id: recipient.id,
      event_type: "recipient_sent",
      payload: {
        phone: recipient.contact.phone,
        evolutionMessageId,
        messageId: message?.id || null,
      },
    });
    return "sent";
  } catch (error) {
    await BroadcastRepository.updateRecipient(recipient, {
      status: "failed",
      error_message: error.message,
    });
    await BroadcastRepository.createBroadcastLog({
      broadcast_id: broadcast.id,
      broadcast_recipient_id: recipient.id,
      event_type: "recipient_failed",
      payload: { phone: recipient.contact.phone, error: error.message },
    });
    return "failed";
  }
};

export const sendNow = async (broadcastId) => {
  try {
    console.log("STEP 1");

    let broadcast = await getBroadcast(broadcastId);

    console.log("STEP 2");

    await resolveRecipients(broadcast);

    console.log("STEP 3");

    broadcast = await getBroadcast(broadcastId);

    console.log("STEP 4");

    await BroadcastRepository.updateBroadcast(broadcast, {
      status: "sending",
      started_at: new Date(),
    });

    console.log("STEP 5");

    const recipients = await BroadcastRepository.findRecipients({
      broadcastId: broadcast.id,
      status: ["pending", "failed"],
      limit: 100000,
    });

    console.log("STEP 6 recipients:", recipients.length);

    for (const recipient of recipients) {
      console.log("STEP 7 sending:", recipient.id);

      await sendRecipient({
        broadcast,
        recipient,
      });

      console.log("STEP 8 sent:", recipient.id);
    }

    console.log("STEP 9 complete");
  } catch (error) {
    console.error("SEND NOW ERROR:", error);
    throw error;
  }
};

export const processDueBroadcasts = async () => {
  const broadcasts = await BroadcastRepository.findDueScheduledBroadcasts();
  const results = [];
  for (const broadcast of broadcasts) {
    try {
      await sendNow(broadcast.id);
      results.push({ broadcastId: broadcast.id, status: "sent" });
    } catch (error) {
      await BroadcastRepository.updateBroadcast(broadcast, {
        status: "failed",
        completed_at: new Date(),
      });
      results.push({
        broadcastId: broadcast.id,
        status: "failed",
        error: error.message,
      });
    }
  }
  return results;
};

export const getRecipients = (broadcastId) =>
  BroadcastRepository.findRecipientsByBroadcast(broadcastId);

export const getLogs = (broadcastId) =>
  BroadcastRepository.findBroadcastLogs(broadcastId);

export const startCampaign = (broadcastId) => sendNow(broadcastId);

export const retryFailed = async (broadcastId) => {
  const broadcast = await getBroadcast(broadcastId);
  if (broadcast.status === "cancelled")
    throw new ApiError(409, "Cannot retry cancelled broadcast");
  return sendNow(broadcastId);
};

export const updateDeliveryStatus = async ({
  evolutionMessageId,
  messageId,
  status,
}) => {
  let recipient = null;
  if (messageId)
    recipient = await BroadcastRepository.findRecipientByMessageId(messageId);
  if (!recipient && evolutionMessageId)
    recipient =
      await BroadcastRepository.findRecipientByEvolutionMessageId(
        evolutionMessageId,
      );
  if (!recipient)
    throw new ApiError(
      404,
      "Broadcast recipient not found for delivery update",
    );

  const timestampFields = {
    delivered: { delivered_at: new Date() },
    read: { read_at: new Date() },
    sent: { sent_at: new Date() },
  };

  await BroadcastRepository.updateRecipient(recipient, {
    status,
    ...(timestampFields[status] || {}),
  });

  await BroadcastRepository.createBroadcastLog({
    broadcast_id: recipient.broadcast_id,
    broadcast_recipient_id: recipient.id,
    event_type: `recipient_${status}`,
    payload: { evolutionMessageId, messageId },
  });

  return recipient.reload();
};

export const queueStatus = () => BroadcastQueue.getStatus();

export default {
  importExcel,
  listBroadcasts,
  getBroadcast,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  cancelCampaign,
  scheduleCampaign,
  sendNow,
  processDueBroadcasts,
  startCampaign,
  retryFailed,
  updateDeliveryStatus,
  getRecipients,
  getLogs,
  resolveRecipients,
  queueStatus,
};
