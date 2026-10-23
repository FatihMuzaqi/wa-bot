import { EvolutionWebhookService } from './evolutionWebhook.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

const responsePayload = ({ event, created, duplicate, syncedContact, syncedChat, syncedMessage, botJob }) => ({
  id: event.id,
  eventKey: event.event_key,
  eventType: event.event_type,
  instanceName: event.instance_name,
  duplicate,
  duplicateCount: event.duplicate_count,
  created,
  syncedContact: Array.isArray(syncedContact)
    ? syncedContact.map((contact) => ({ id: contact.id, phone: contact.phone, name: contact.name }))
    : syncedContact && { id: syncedContact.id, phone: syncedContact.phone, name: syncedContact.name },
  syncedChat: syncedChat && {
    id: syncedChat.chat?.id,
    created: syncedChat.created,
    status: syncedChat.chat?.status,
    unreadCount: syncedChat.chat?.unread_count,
  },
  syncedMessage: syncedMessage && {
    id: syncedMessage.id,
    messageId: syncedMessage.evolution_message_id,
    chatId: syncedMessage.chat_id,
    contactId: syncedMessage.contact_id,
    instanceName: syncedMessage.instance_name,
    direction: syncedMessage.direction,
    messageType: syncedMessage.message_type,
    status: syncedMessage.status,
    timestamp: syncedMessage.message_timestamp,
  },
  botJob,
});

export const receive = asyncHandler(async (req, res) => {
  const result = await EvolutionWebhookService.storeWebhookEvent(req, req.params.eventType);
  return successResponse(res, responsePayload(result), result.duplicate ? 'Duplicate webhook ignored' : 'Webhook stored');
});

export const receiveMessageUpsert = asyncHandler(async (req, res) => {
  const result = await EvolutionWebhookService.storeWebhookEvent(req, 'messages.upsert');
  return successResponse(res, responsePayload(result), result.duplicate ? 'Duplicate messages.upsert ignored' : 'messages.upsert stored');
});

export const receiveMessagesUpdate = asyncHandler(async (req, res) => {
  const result = await EvolutionWebhookService.storeWebhookEvent(req, 'messages.update');
  return successResponse(res, responsePayload(result), result.duplicate ? 'Duplicate messages.update ignored' : 'messages.update stored');
});

export const receiveContactsUpdate = asyncHandler(async (req, res) => {
  const result = await EvolutionWebhookService.storeWebhookEvent(req, 'contacts.update');
  return successResponse(res, responsePayload(result), result.duplicate ? 'Duplicate contacts.update ignored' : 'contacts.update stored');
});

export const receiveConnectionUpdate = asyncHandler(async (req, res) => {
  const result = await EvolutionWebhookService.storeWebhookEvent(req, 'connection.update');
  return successResponse(res, responsePayload(result), result.duplicate ? 'Duplicate connection.update ignored' : 'connection.update stored');
});

export const receiveQrUpdated = asyncHandler(async (req, res) => {
  const result = await EvolutionWebhookService.storeWebhookEvent(req, 'qr.updated');
  return successResponse(res, responsePayload(result), result.duplicate ? 'Duplicate qr.updated ignored' : 'qr.updated stored');
});

export default {
  receive,
  receiveMessageUpsert,
  receiveMessagesUpdate,
  receiveContactsUpdate,
  receiveConnectionUpdate,
  receiveQrUpdated,
};
