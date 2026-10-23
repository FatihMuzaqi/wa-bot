import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './modules/auth/auth.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import liveChatRoutes from './modules/live-chat/liveChat.routes.js';
import botRulesRoutes from './modules/bot-rules/botRules.routes.js';
import botMenusRoutes from './modules/bot-menus/botMenus.routes.js';
import botEngineRoutes from './modules/bot-engine/botEngine.routes.js';
import formsRoutes from './modules/forms/forms.routes.js';
import aiChatbotRoutes from './modules/ai-chatbot/aiChatbot.routes.js';
import broadcastRoutes from './modules/broadcast/broadcast.routes.js';
import schedulerRoutes from './modules/scheduler/scheduler.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import evolutionRoutes from './integrations/evolution/evolution.routes.js';
import evolutionWebhookRoutes from './integrations/evolution/evolutionWebhook.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chats', liveChatRoutes);
app.use('/api/bot-rules', botRulesRoutes);
app.use('/api/bot-menus', botMenusRoutes);
app.use('/api/bot-engine', botEngineRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/ai-chatbot', aiChatbotRoutes);
app.use('/api/ai', aiChatbotRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/schedules', schedulerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/webhooks/evolution', evolutionWebhookRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
