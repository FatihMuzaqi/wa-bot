import { Op } from "sequelize";
import models from "../../../database/models/index.js";

const {
  Broadcast,
  BroadcastRecipient,
  BroadcastLog,
  Chat,
  Contact,
  ContactTag,
  Message,
} = models;

export const createBroadcast = (payload, options = {}) =>
  Broadcast.create(payload, options);

export const findBroadcastById = (broadcastId) =>
  Broadcast.findByPk(broadcastId, {
    include: [
      {
        model: BroadcastRecipient,
        as: "recipients",
        include: [
          { model: Contact, as: "contact" },
          { model: Message, as: "message" },
        ],
      },
      {
        model: BroadcastLog,
        as: "logs",
        separate: true,
        order: [
          ["created_at", "DESC"],
          ["id", "DESC"],
        ],
        limit: 100,
      },
    ],
  });

export const findBroadcasts = ({ page = 1, limit = 20, status } = {}) => {
  const where = {};
  if (status) where.status = status;

  return Broadcast.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    include: [
      {
        model: BroadcastRecipient,
        as: "recipients",
        include: [{ model: Contact, as: "contact" }],
      },
    ],
  });
};

export const updateBroadcast = (broadcast, payload, options = {}) =>
  broadcast.update(payload, options);

export const createRecipients = (rows, options = {}) =>
  BroadcastRecipient.bulkCreate(rows, {
    ignoreDuplicates: true,
    ...options,
  });

export const countRecipients = (broadcastId) =>
  BroadcastRecipient.count({
    where: { broadcast_id: broadcastId },
  });

export const findDueScheduledBroadcasts = (now = new Date()) =>
  Broadcast.findAll({
    where: {
      status: "scheduled",
      scheduled_at: { [Op.lte]: now },
    },
    order: [["scheduled_at", "ASC"]],
    limit: 50,
  });

export const findRecipients = ({ broadcastId, status, limit = 100 } = {}) => {
  const where = {};
  if (broadcastId) where.broadcast_id = broadcastId;
  if (status)
    where.status = Array.isArray(status) ? { [Op.in]: status } : status;

  return BroadcastRecipient.findAll({
    where,
    include: [{ model: Contact, as: "contact" }],
    order: [["id", "ASC"]],
    limit,
  });
};

export const findRecipientById = (recipientId) =>
  BroadcastRecipient.findByPk(recipientId, {
    include: [
      { model: Contact, as: "contact" },
      { model: Broadcast, as: "broadcast" },
    ],
  });

export const findRecipientsByBroadcast = (broadcastId) =>
  BroadcastRecipient.findAll({
    where: { broadcast_id: broadcastId },
    include: [
      { model: Contact, as: "contact" },
      { model: Message, as: "message" },
    ],
    order: [["id", "ASC"]],
  });

export const countRecipientsByStatus = (broadcastId) =>
  BroadcastRecipient.findAll({
    where: { broadcast_id: broadcastId },
    attributes: [
      "status",
      [
        BroadcastRecipient.sequelize.fn(
          "COUNT",
          BroadcastRecipient.sequelize.col("id"),
        ),
        "count",
      ],
    ],
    group: ["status"],
    raw: true,
  });

export const updateRecipient = (recipient, payload, options = {}) =>
  recipient.update(payload, options);

export const findRecipientByMessageId = (messageId) =>
  BroadcastRecipient.findOne({
    where: { message_id: messageId },
    include: [{ model: Broadcast, as: "broadcast" }],
  });

export const findRecipientByEvolutionMessageId = (evolutionMessageId) =>
  BroadcastRecipient.findOne({
    where: { evolution_message_id: evolutionMessageId },
    include: [{ model: Broadcast, as: "broadcast" }],
  });

export const createBroadcastLog = (payload, options = {}) =>
  BroadcastLog.create(payload, options);

export const findBroadcastLogs = (broadcastId) =>
  BroadcastLog.findAll({
    where: { broadcast_id: broadcastId },
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ],
  });

export const createMessage = (payload, options = {}) =>
  Message.create(payload, options);

export const findOrCreateContact = async ({ name, phone }) => {
  const [contact] = await Contact.findOrCreate({
    where: { phone },
    defaults: {
      name,
      phone,
      whatsapp_id: `${phone}@s.whatsapp.net`,
    },
  });

  if (name && !contact.name) {
    await contact.update({ name });
  }

  return contact;
};

export const findAllContacts = () =>
  Contact.findAll({
    where: { status: "active", phone: { [Op.ne]: null } },
    order: [["id", "ASC"]],
  });

export const findContactsByIds = (contactIds = []) =>
  Contact.findAll({
    where: { id: { [Op.in]: contactIds }, status: "active" },
    order: [["id", "ASC"]],
  });

export const findContactsByChatStatus = async (status) => {
  const chats = await Chat.findAll({
    where: { status },
    include: [{ model: Contact, as: "contact", where: { status: "active" } }],
    order: [
      ["last_message_at", "DESC"],
      ["id", "DESC"],
    ],
  });
  return chats.map((chat) => chat.contact).filter(Boolean);
};

export const findChatByContactId = (contactId) =>
  Chat.findOne({
    where: { contact_id: contactId },
    order: [
      ["last_message_at", "DESC"],
      ["id", "DESC"],
    ],
  });

export const findContactsBySegment = async (audienceFilter = {}) => {
  const where = {
    status: "active",
  };

  if (audienceFilter.contactIds?.length) {
    where.id = { [Op.in]: audienceFilter.contactIds };
  }

  if (audienceFilter.source) {
    where.source = audienceFilter.source;
  }

  if (audienceFilter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${audienceFilter.search}%` } },
      { phone: { [Op.like]: `%${audienceFilter.search}%` } },
      { email: { [Op.like]: `%${audienceFilter.search}%` } },
    ];
  }

  const include = [];
  if (audienceFilter.tags?.length) {
    include.push({
      model: ContactTag,
      as: "tags",
      where: { name: { [Op.in]: audienceFilter.tags } },
      required: true,
    });
  }

  return Contact.findAll({
    where,
    include,
    order: [["id", "ASC"]],
  });
};

export default {
  createBroadcast,
  findBroadcastById,
  findBroadcasts,
  findDueScheduledBroadcasts,
  updateBroadcast,
  createRecipients,
  countRecipients,
  findRecipients,
  findRecipientById,
  findRecipientsByBroadcast,
  countRecipientsByStatus,
  updateRecipient,
  findRecipientByMessageId,
  findRecipientByEvolutionMessageId,
  createBroadcastLog,
  findBroadcastLogs,
  createMessage,
  findOrCreateContact,
  findAllContacts,
  findContactsByIds,
  findContactsByChatStatus,
  findChatByContactId,
  findContactsBySegment,
};
