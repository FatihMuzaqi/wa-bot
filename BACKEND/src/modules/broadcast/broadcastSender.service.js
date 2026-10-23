import EvolutionService from '../../integrations/evolution/evolution.service.js';
import SocketService from '../../sockets/socket.service.js';
import BroadcastRepository from './repositories/broadcast.repository.js';
import BroadcastQueue from './broadcast.queue.js';

const maxRetries = () => Number(process.env.BROADCAST_MAX_RETRIES || 3);
const retryDelayMs = () => Number(process.env.BROADCAST_RETRY_DELAY_MS || 5000);

const extractEvolutionMessageId = (response) => (
  response?.key?.id
  || response?.message?.key?.id
  || response?.data?.key?.id
  || response?.id
  || null
);

const renderTemplate = (template, contact) => String(template || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
  if (key === 'name') return contact.name || '';
  if (key === 'phone') return contact.phone || '';
  if (key === 'email') return contact.email || '';
  return contact.metadata?.[key] || '';
});

const refreshBroadcastCompletion = async (broadcastId) => {
  const rows = await BroadcastRepository.countRecipientsByStatus(broadcastId);
  const counts = Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
  const pending = (counts.pending || 0) + (counts.queued || 0);

  if (pending > 0) return;

  const broadcast = await BroadcastRepository.findBroadcastById(broadcastId);
  if (!broadcast || ['completed', 'cancelled'].includes(broadcast.status)) return;

  await BroadcastRepository.updateBroadcast(broadcast, {
    status: 'completed',
    completed_at: new Date(),
    metadata: {
      ...(broadcast.metadata || {}),
      deliverySummary: counts,
    },
  });

  await BroadcastRepository.createBroadcastLog({
    broadcast_id: broadcastId,
    event_type: 'campaign_completed',
    payload: { counts },
  });

  SocketService.emitGlobal('broadcast:update', {
    broadcastId,
    status: 'completed',
    counts,
  });
};

const sendByType = async ({ broadcast, contact }) => {
  const payload = broadcast.message_payload || {};
  const instanceName = payload.instanceName;

  if (broadcast.message_type === 'media') {
    if (payload.mediaType === 'image') {
      return EvolutionService.sendImage({
        instanceName,
        number: contact.phone,
        media: payload.media,
        caption: renderTemplate(payload.caption, contact),
        fileName: payload.fileName,
      });
    }

    if (payload.mediaType === 'document') {
      return EvolutionService.sendDocument({
        instanceName,
        number: contact.phone,
        media: payload.media,
        fileName: payload.fileName,
        caption: renderTemplate(payload.caption, contact),
        mimetype: payload.mimetype,
      });
    }
  }

  return EvolutionService.sendText({
    instanceName,
    number: contact.phone,
    text: renderTemplate(payload.text || payload.message, contact),
  });
};

export const processRecipient = async ({ broadcastId, recipientId, attempt = 1 }) => {
  const broadcast = await BroadcastRepository.findBroadcastById(broadcastId);
  if (!broadcast || ['cancelled', 'completed'].includes(broadcast.status)) return;

  const recipient = broadcast.recipients.find((item) => Number(item.id) === Number(recipientId));
  if (!recipient || !['pending', 'queued', 'failed'].includes(recipient.status)) return;

  await BroadcastRepository.updateRecipient(recipient, {
    status: 'queued',
    queued_at: new Date(),
    error_message: null,
  });

  try {
    const evolutionResponse = await sendByType({
      broadcast,
      contact: recipient.contact,
    });

    await BroadcastRepository.updateRecipient(recipient, {
      status: 'sent',
      evolution_message_id: extractEvolutionMessageId(evolutionResponse),
      sent_at: new Date(),
    });

    await BroadcastRepository.createBroadcastLog({
      broadcast_id: broadcast.id,
      broadcast_recipient_id: recipient.id,
      event_type: 'recipient_sent',
      payload: { attempt, evolutionResponse },
    });

    SocketService.emitGlobal('broadcast:update', {
      broadcastId: broadcast.id,
      recipientId: recipient.id,
      status: 'sent',
    });

    await refreshBroadcastCompletion(broadcast.id);
  } catch (error) {
    await BroadcastRepository.updateRecipient(recipient, {
      status: 'failed',
      error_message: error.message,
    });

    await BroadcastRepository.createBroadcastLog({
      broadcast_id: broadcast.id,
      broadcast_recipient_id: recipient.id,
      event_type: 'recipient_failed',
      payload: { attempt, error: error.message },
    });

    if (attempt < maxRetries()) {
      BroadcastQueue.enqueueRecipient({
        broadcastId,
        recipientId,
        attempt: attempt + 1,
        delayMs: retryDelayMs(),
      });
    } else {
      await refreshBroadcastCompletion(broadcast.id);
    }
  }
};

BroadcastQueue.registerHandler(processRecipient);

export default {
  processRecipient,
};
