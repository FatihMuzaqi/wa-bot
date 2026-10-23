import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize.js';
import models from '../../database/models/index.js';
import BroadcastQueue from '../broadcast/broadcast.queue.js';
import BotQueue from '../bot-engine/botEngine.queue.js';

const {
  AuditLog,
  BotRule,
  Broadcast,
  Chat,
  Contact,
  Message,
  Schedule,
} = models;

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDuration = (seconds) => {
  const value = Number(seconds || 0);
  if (!value) return '0s';

  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.round(value % 60);
  if (minutes === 0) return `${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m ${remainingSeconds}s`;

  return `${hours}h ${remainingMinutes}m`;
};

const lastDays = (days) => Array.from({ length: days }).map((_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1 - index));
  date.setHours(0, 0, 0, 0);
  return date;
});

export const getSummary = async () => {
  const [analytics, scheduledItems, activeBotRules] = await Promise.all([
    getAnalytics(),
    Schedule.count({ where: { status: 'active' } }),
    BotRule.count({ where: { is_active: true } }),
  ]);

  return {
    totalChats: analytics.totalChats,
    activeChats: analytics.activeChats,
    messagesToday: analytics.messagesToday,
    botMessagesToday: analytics.botVsHuman.bot,
    humanMessagesToday: analytics.botVsHuman.human,
    botHandledPercent: analytics.botVsHuman.botPercent,
    humanHandledPercent: analytics.botVsHuman.humanPercent,
    averageResponseTimeSeconds: analytics.responseTime.averageSeconds,
    averageResponseTimeFormatted: analytics.responseTime.formatted,
    activeAgents: analytics.activeAgents,
    scheduledItems,
    activeContacts: analytics.totalContacts,
    activeBotRules,
  };
};

export const getAnalytics = async () => {
  const today = startOfDay();

  const [
    totalContacts,
    totalChats,
    activeChats,
    closedChats,
    messagesToday,
    botMessagesToday,
    humanMessagesToday,
    assignedAgentRows,
    respondingAgentRows,
    responseTimeRows,
  ] = await Promise.all([
    Contact.count(),
    Chat.count(),
    Chat.count({ where: { status: { [Op.ne]: 'closed' } } }),
    Chat.count({ where: { status: 'closed' } }),
    Message.count({ where: { created_at: { [Op.gte]: today } } }),
    Message.count({
      where: {
        sender_type: { [Op.in]: ['bot', 'ai'] },
        created_at: { [Op.gte]: today },
      },
    }),
    Message.count({
      where: {
        sender_type: 'agent',
        created_at: { [Op.gte]: today },
      },
    }),
    Chat.findAll({
      attributes: ['assigned_agent_id'],
      where: {
        assigned_agent_id: { [Op.ne]: null },
        status: { [Op.ne]: 'closed' },
      },
      group: ['assigned_agent_id'],
      raw: true,
    }),
    Message.findAll({
      attributes: ['sender_user_id'],
      where: {
        sender_type: 'agent',
        sender_user_id: { [Op.ne]: null },
        created_at: { [Op.gte]: today },
      },
      group: ['sender_user_id'],
      raw: true,
    }),
    sequelize.query(
      `SELECT AVG(TIMESTAMPDIFF(SECOND, inbound.created_at, (
        SELECT MIN(outbound.created_at)
        FROM messages outbound
        WHERE outbound.chat_id = inbound.chat_id
          AND outbound.created_at > inbound.created_at
          AND outbound.direction = 'outbound'
          AND outbound.sender_type IN ('agent', 'bot', 'ai')
      ))) AS averageSeconds
      FROM messages inbound
      WHERE inbound.direction = 'inbound'
        AND inbound.sender_type = 'contact'
        AND inbound.created_at >= :today`,
      {
        replacements: { today },
        type: QueryTypes.SELECT,
      },
    ),
  ]);

  const handledMessagesToday = botMessagesToday + humanMessagesToday;
  const averageResponseTimeSeconds = Math.round(Number(responseTimeRows?.[0]?.averageSeconds || 0));
  const activeAgentIds = new Set([
    ...assignedAgentRows.map((row) => String(row.assigned_agent_id)),
    ...respondingAgentRows.map((row) => String(row.sender_user_id)),
  ].filter(Boolean));

  return {
    totalContacts,
    totalChats,
    activeChats,
    closedChats,
    messagesToday,
    botVsHuman: {
      bot: botMessagesToday,
      human: humanMessagesToday,
      total: handledMessagesToday,
      botPercent: handledMessagesToday ? Math.round((botMessagesToday / handledMessagesToday) * 100) : 0,
      humanPercent: handledMessagesToday ? Math.round((humanMessagesToday / handledMessagesToday) * 100) : 0,
    },
    responseTime: {
      averageSeconds: averageResponseTimeSeconds,
      formatted: formatDuration(averageResponseTimeSeconds),
    },
    activeAgents: activeAgentIds.size,
  };
};

export const getMessageTrend = async () => {
  const days = lastDays(7);
  const rows = await Message.findAll({
    attributes: [
      [fn('DATE', col('created_at')), 'date'],
      [fn('COUNT', col('id')), 'messages'],
    ],
    where: { created_at: { [Op.gte]: days[0] } },
    group: [literal('DATE(created_at)')],
    raw: true,
  });

  const byDate = new Map(rows.map((row) => [String(row.date), Number(row.messages)]));
  return days.map((date) => {
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      messages: byDate.get(key) || 0,
    };
  });
};

export const getHandlingTrend = async () => {
  const days = lastDays(7);
  const rows = await Message.findAll({
    attributes: [
      [fn('DATE', col('created_at')), 'date'],
      'sender_type',
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { created_at: { [Op.gte]: days[0] } },
    group: [literal('DATE(created_at)'), 'sender_type'],
    raw: true,
  });

  return days.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const matching = rows.filter((row) => String(row.date) === key);
    const bot = matching
      .filter((row) => ['bot', 'ai'].includes(row.sender_type))
      .reduce((sum, row) => sum + Number(row.count), 0);
    const human = matching
      .filter((row) => row.sender_type === 'agent')
      .reduce((sum, row) => sum + Number(row.count), 0);
    return { name: date.toLocaleDateString('en-US', { weekday: 'short' }), bot, human };
  });
};

export const getBroadcastPerformance = async () => {
  const broadcasts = await Broadcast.findAll({
    order: [['created_at', 'DESC']],
    limit: 10,
    include: [{ model: models.BroadcastRecipient, as: 'recipients' }],
  });

  return broadcasts.map((broadcast) => {
    const recipients = broadcast.recipients || [];
    return {
      id: broadcast.id,
      name: broadcast.name,
      status: broadcast.status,
      sent: recipients.filter((item) => ['sent', 'delivered', 'read'].includes(item.status)).length,
      delivered: recipients.filter((item) => ['delivered', 'read'].includes(item.status)).length,
      read: recipients.filter((item) => item.status === 'read').length,
      failed: recipients.filter((item) => item.status === 'failed').length,
      total: recipients.length,
    };
  });
};

export const getRecentActivity = async () => {
  const rows = await AuditLog.findAll({ order: [['created_at', 'DESC']], limit: 10 });
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    payload: row.payload,
  }));
};

export const getSystemHealth = () => ({
  whatsappApi: 'unknown',
  botEngine: 'active',
  aiService: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
  database: 'connected',
  broadcastQueue: BroadcastQueue.getStatus(),
  botQueue: BotQueue.getStatus(),
});

export const getDashboard = async () => ({
  summary: await getSummary(),
  analytics: await getAnalytics(),
  messageTrend: await getMessageTrend(),
  handlingTrend: await getHandlingTrend(),
  broadcastPerformance: await getBroadcastPerformance(),
  recentActivity: await getRecentActivity(),
  systemHealth: getSystemHealth(),
});

export default {
  getDashboard,
  getSummary,
  getAnalytics,
  getMessageTrend,
  getHandlingTrend,
  getBroadcastPerformance,
  getRecentActivity,
  getSystemHealth,
};
