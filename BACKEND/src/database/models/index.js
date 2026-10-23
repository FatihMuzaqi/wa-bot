import sequelize from '../sequelize.js';
import Role from './Role.js';
import Permission from './Permission.js';
import User from './User.js';
import UserSession from './UserSession.js';
import Contact from './Contact.js';
import ContactTag from './ContactTag.js';
import Chat from './Chat.js';
import Message from './Message.js';
import ChatAssignment from './ChatAssignment.js';
import BotRule from './BotRule.js';
import BotRuleLog from './BotRuleLog.js';
import BotMenu from './BotMenu.js';
import BotMenuItem from './BotMenuItem.js';
import Form from './Form.js';
import FormStep from './FormStep.js';
import FormSubmission from './FormSubmission.js';
import FormAnswer from './FormAnswer.js';
import Broadcast from './Broadcast.js';
import BroadcastRecipient from './BroadcastRecipient.js';
import BroadcastLog from './BroadcastLog.js';
import Schedule from './Schedule.js';
import ScheduleRun from './ScheduleRun.js';
import AiKnowledgeSource from './AiKnowledgeSource.js';
import AiDocument from './AiDocument.js';
import AiPrompt from './AiPrompt.js';
import AiInteraction from './AiInteraction.js';
import AutomationWorkflow from './AutomationWorkflow.js';
import DocumentTemplate from './DocumentTemplate.js';
import GeneratedDocument from './GeneratedDocument.js';
import Notification from './Notification.js';
import Setting from './Setting.js';
import AuditLog from './AuditLog.js';
import EvolutionWebhookEvent from './EvolutionWebhookEvent.js';

const models = {
  Role: Role.initModel(sequelize),
  Permission: Permission.initModel(sequelize),
  User: User.initModel(sequelize),
  UserSession: UserSession.initModel(sequelize),
  Contact: Contact.initModel(sequelize),
  ContactTag: ContactTag.initModel(sequelize),
  Chat: Chat.initModel(sequelize),
  Message: Message.initModel(sequelize),
  ChatAssignment: ChatAssignment.initModel(sequelize),
  BotRule: BotRule.initModel(sequelize),
  BotRuleLog: BotRuleLog.initModel(sequelize),
  BotMenu: BotMenu.initModel(sequelize),
  BotMenuItem: BotMenuItem.initModel(sequelize),
  Form: Form.initModel(sequelize),
  FormStep: FormStep.initModel(sequelize),
  FormSubmission: FormSubmission.initModel(sequelize),
  FormAnswer: FormAnswer.initModel(sequelize),
  Broadcast: Broadcast.initModel(sequelize),
  BroadcastRecipient: BroadcastRecipient.initModel(sequelize),
  BroadcastLog: BroadcastLog.initModel(sequelize),
  Schedule: Schedule.initModel(sequelize),
  ScheduleRun: ScheduleRun.initModel(sequelize),
  AiKnowledgeSource: AiKnowledgeSource.initModel(sequelize),
  AiDocument: AiDocument.initModel(sequelize),
  AiPrompt: AiPrompt.initModel(sequelize),
  AiInteraction: AiInteraction.initModel(sequelize),
  AutomationWorkflow: AutomationWorkflow.initModel(sequelize),
  DocumentTemplate: DocumentTemplate.initModel(sequelize),
  GeneratedDocument: GeneratedDocument.initModel(sequelize),
  Notification: Notification.initModel(sequelize),
  Setting: Setting.initModel(sequelize),
  AuditLog: AuditLog.initModel(sequelize),
  EvolutionWebhookEvent: EvolutionWebhookEvent.initModel(sequelize),
};

models.Role.hasMany(models.Permission, { foreignKey: 'role_id', as: 'permissions' });
models.Permission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
models.Role.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });
models.User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
models.User.hasMany(models.UserSession, { foreignKey: 'user_id', as: 'sessions' });
models.UserSession.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

models.Contact.hasMany(models.ContactTag, { foreignKey: 'contact_id', as: 'tags' });
models.ContactTag.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
models.User.hasMany(models.ContactTag, { foreignKey: 'created_by', as: 'createdContactTags' });
models.ContactTag.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });

models.Contact.hasMany(models.Chat, { foreignKey: 'contact_id', as: 'chats' });
models.Chat.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
models.User.hasMany(models.Chat, { foreignKey: 'assigned_agent_id', as: 'assignedChats' });
models.Chat.belongsTo(models.User, { foreignKey: 'assigned_agent_id', as: 'assignedAgent' });

models.Chat.hasMany(models.Message, { foreignKey: 'chat_id', as: 'messages' });
models.Message.belongsTo(models.Chat, { foreignKey: 'chat_id', as: 'chat' });
models.Contact.hasMany(models.Message, { foreignKey: 'contact_id', as: 'messages' });
models.Message.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
models.User.hasMany(models.Message, { foreignKey: 'sender_user_id', as: 'sentMessages' });
models.Message.belongsTo(models.User, { foreignKey: 'sender_user_id', as: 'senderUser' });

models.Chat.hasMany(models.ChatAssignment, { foreignKey: 'chat_id', as: 'assignments' });
models.ChatAssignment.belongsTo(models.Chat, { foreignKey: 'chat_id', as: 'chat' });
models.User.hasMany(models.ChatAssignment, { foreignKey: 'assigned_to_user_id', as: 'receivedAssignments' });
models.ChatAssignment.belongsTo(models.User, { foreignKey: 'assigned_to_user_id', as: 'assignedTo' });
models.User.hasMany(models.ChatAssignment, { foreignKey: 'assigned_by_user_id', as: 'createdAssignments' });
models.ChatAssignment.belongsTo(models.User, { foreignKey: 'assigned_by_user_id', as: 'assignedBy' });

models.User.hasMany(models.Form, { foreignKey: 'created_by', as: 'createdForms' });
models.Form.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.Form.hasMany(models.FormStep, { foreignKey: 'form_id', as: 'steps' });
models.FormStep.belongsTo(models.Form, { foreignKey: 'form_id', as: 'form' });
models.Form.hasMany(models.FormSubmission, { foreignKey: 'form_id', as: 'submissions' });
models.FormSubmission.belongsTo(models.Form, { foreignKey: 'form_id', as: 'form' });
models.Contact.hasMany(models.FormSubmission, { foreignKey: 'contact_id', as: 'formSubmissions' });
models.FormSubmission.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
models.Chat.hasMany(models.FormSubmission, { foreignKey: 'chat_id', as: 'formSubmissions' });
models.FormSubmission.belongsTo(models.Chat, { foreignKey: 'chat_id', as: 'chat' });
models.FormSubmission.hasMany(models.FormAnswer, { foreignKey: 'form_submission_id', as: 'answers' });
models.FormAnswer.belongsTo(models.FormSubmission, { foreignKey: 'form_submission_id', as: 'submission' });
models.FormStep.hasMany(models.FormAnswer, { foreignKey: 'form_step_id', as: 'answers' });
models.FormAnswer.belongsTo(models.FormStep, { foreignKey: 'form_step_id', as: 'step' });

models.User.hasMany(models.BotRule, { foreignKey: 'created_by', as: 'createdBotRules' });
models.BotRule.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.Form.hasMany(models.BotRule, { foreignKey: 'form_id', as: 'botRules' });
models.BotRule.belongsTo(models.Form, { foreignKey: 'form_id', as: 'form' });
models.BotRule.hasMany(models.BotRuleLog, { foreignKey: 'bot_rule_id', as: 'logs' });
models.BotRuleLog.belongsTo(models.BotRule, { foreignKey: 'bot_rule_id', as: 'botRule' });
models.Chat.hasMany(models.BotRuleLog, { foreignKey: 'chat_id', as: 'botRuleLogs' });
models.BotRuleLog.belongsTo(models.Chat, { foreignKey: 'chat_id', as: 'chat' });
models.Message.hasMany(models.BotRuleLog, { foreignKey: 'message_id', as: 'botRuleLogs' });
models.BotRuleLog.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });

models.User.hasMany(models.BotMenu, { foreignKey: 'created_by', as: 'createdBotMenus' });
models.BotMenu.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.BotMenu.hasMany(models.BotMenuItem, { foreignKey: 'bot_menu_id', as: 'items' });
models.BotMenuItem.belongsTo(models.BotMenu, { foreignKey: 'bot_menu_id', as: 'menu' });
models.Form.hasMany(models.BotMenuItem, { foreignKey: 'form_id', as: 'menuItems' });
models.BotMenuItem.belongsTo(models.Form, { foreignKey: 'form_id', as: 'form' });

models.User.hasMany(models.Broadcast, { foreignKey: 'created_by', as: 'createdBroadcasts' });
models.Broadcast.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.Broadcast.hasMany(models.BroadcastRecipient, { foreignKey: 'broadcast_id', as: 'recipients' });
models.BroadcastRecipient.belongsTo(models.Broadcast, { foreignKey: 'broadcast_id', as: 'broadcast' });
models.Contact.hasMany(models.BroadcastRecipient, { foreignKey: 'contact_id', as: 'broadcastRecipients' });
models.BroadcastRecipient.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
models.Message.hasOne(models.BroadcastRecipient, { foreignKey: 'message_id', as: 'broadcastRecipient' });
models.BroadcastRecipient.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });
models.Broadcast.hasMany(models.BroadcastLog, { foreignKey: 'broadcast_id', as: 'logs' });
models.BroadcastLog.belongsTo(models.Broadcast, { foreignKey: 'broadcast_id', as: 'broadcast' });
models.BroadcastRecipient.hasMany(models.BroadcastLog, { foreignKey: 'broadcast_recipient_id', as: 'logs' });
models.BroadcastLog.belongsTo(models.BroadcastRecipient, { foreignKey: 'broadcast_recipient_id', as: 'recipient' });

models.User.hasMany(models.Schedule, { foreignKey: 'created_by', as: 'createdSchedules' });
models.Schedule.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.Schedule.hasMany(models.ScheduleRun, { foreignKey: 'schedule_id', as: 'runs' });
models.ScheduleRun.belongsTo(models.Schedule, { foreignKey: 'schedule_id', as: 'schedule' });
models.Broadcast.hasMany(models.ScheduleRun, { foreignKey: 'broadcast_id', as: 'scheduleRuns' });
models.ScheduleRun.belongsTo(models.Broadcast, { foreignKey: 'broadcast_id', as: 'broadcast' });

models.User.hasMany(models.AiKnowledgeSource, { foreignKey: 'created_by', as: 'createdAiKnowledgeSources' });
models.AiKnowledgeSource.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.AiKnowledgeSource.hasMany(models.AiDocument, { foreignKey: 'ai_knowledge_source_id', as: 'documents' });
models.AiDocument.belongsTo(models.AiKnowledgeSource, { foreignKey: 'ai_knowledge_source_id', as: 'knowledgeSource' });
models.User.hasMany(models.AiPrompt, { foreignKey: 'created_by', as: 'createdAiPrompts' });
models.AiPrompt.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.Chat.hasMany(models.AiInteraction, { foreignKey: 'chat_id', as: 'aiInteractions' });
models.AiInteraction.belongsTo(models.Chat, { foreignKey: 'chat_id', as: 'chat' });
models.Message.hasMany(models.AiInteraction, { foreignKey: 'message_id', as: 'aiInteractions' });
models.AiInteraction.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });
models.AiPrompt.hasMany(models.AiInteraction, { foreignKey: 'ai_prompt_id', as: 'interactions' });
models.AiInteraction.belongsTo(models.AiPrompt, { foreignKey: 'ai_prompt_id', as: 'prompt' });

models.User.hasMany(models.AutomationWorkflow, { foreignKey: 'created_by', as: 'createdAutomationWorkflows' });
models.AutomationWorkflow.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });

models.User.hasMany(models.DocumentTemplate, { foreignKey: 'created_by', as: 'createdDocumentTemplates' });
models.DocumentTemplate.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
models.DocumentTemplate.hasMany(models.GeneratedDocument, { foreignKey: 'document_template_id', as: 'generatedDocuments' });
models.GeneratedDocument.belongsTo(models.DocumentTemplate, { foreignKey: 'document_template_id', as: 'template' });
models.Contact.hasMany(models.GeneratedDocument, { foreignKey: 'contact_id', as: 'generatedDocuments' });
models.GeneratedDocument.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
models.User.hasMany(models.GeneratedDocument, { foreignKey: 'generated_by', as: 'generatedDocuments' });
models.GeneratedDocument.belongsTo(models.User, { foreignKey: 'generated_by', as: 'generatedByUser' });

models.User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
models.Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
models.User.hasMany(models.Setting, { foreignKey: 'updated_by', as: 'updatedSettings' });
models.Setting.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
models.User.hasMany(models.AuditLog, { foreignKey: 'actor_user_id', as: 'auditLogs' });
models.AuditLog.belongsTo(models.User, { foreignKey: 'actor_user_id', as: 'actor' });

export { sequelize };
export default models;
