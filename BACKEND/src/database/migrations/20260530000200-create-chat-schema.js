const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };
const id = (Sequelize) => ({ type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false });
const userFk = (Sequelize, allowNull = true) => ({
  type: Sequelize.BIGINT.UNSIGNED,
  allowNull,
  references: { model: 'users', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: allowNull ? 'SET NULL' : 'RESTRICT',
});
const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
});

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('contacts', {
    id: id(Sequelize),
    whatsapp_id: { type: Sequelize.STRING(191), allowNull: true, unique: true },
    phone: { type: Sequelize.STRING(40), allowNull: false, unique: true },
    name: { type: Sequelize.STRING(150), allowNull: true },
    email: { type: Sequelize.STRING(191), allowNull: true },
    company: { type: Sequelize.STRING(150), allowNull: true },
    source: { type: Sequelize.ENUM('whatsapp', 'form', 'import', 'api', 'manual'), allowNull: false, defaultValue: 'whatsapp' },
    status: { type: Sequelize.ENUM('active', 'blocked', 'archived'), allowNull: false, defaultValue: 'active' },
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('contacts', ['phone'], { name: 'idx_contacts_phone' });
  await queryInterface.addIndex('contacts', ['status'], { name: 'idx_contacts_status' });

  await queryInterface.createTable('contact_tags', {
    id: id(Sequelize),
    contact_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'contacts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: { type: Sequelize.STRING(80), allowNull: false },
    color: { type: Sequelize.STRING(20), allowNull: true },
    created_by: userFk(Sequelize),
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('contact_tags', ['contact_id', 'name'], { unique: true, name: 'uq_contact_tags_contact_name' });

  await queryInterface.createTable('chats', {
    id: id(Sequelize),
    contact_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'contacts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    assigned_agent_id: userFk(Sequelize),
    status: { type: Sequelize.ENUM('bot', 'pending', 'human', 'closed'), allowNull: false, defaultValue: 'bot' },
    priority: { type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'), allowNull: false, defaultValue: 'normal' },
    ai_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    unread_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    last_message_at: { type: Sequelize.DATE, allowNull: true },
    closed_at: { type: Sequelize.DATE, allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('chats', ['contact_id'], { name: 'idx_chats_contact_id' });
  await queryInterface.addIndex('chats', ['assigned_agent_id', 'status'], { name: 'idx_chats_agent_status' });
  await queryInterface.addIndex('chats', ['status', 'last_message_at'], { name: 'idx_chats_status_last_message' });

  await queryInterface.createTable('messages', {
    id: id(Sequelize),
    chat_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'chats', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    contact_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'contacts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    sender_user_id: userFk(Sequelize),
    sender_type: { type: Sequelize.ENUM('contact', 'agent', 'bot', 'ai', 'system'), allowNull: false },
    direction: { type: Sequelize.ENUM('inbound', 'outbound', 'internal'), allowNull: false },
    message_type: { type: Sequelize.ENUM('text', 'image', 'document', 'audio', 'video', 'button', 'template', 'location'), allowNull: false, defaultValue: 'text' },
    content: { type: Sequelize.TEXT, allowNull: true },
    media_url: { type: Sequelize.STRING(500), allowNull: true },
    evolution_message_id: { type: Sequelize.STRING(191), allowNull: true, unique: true },
    status: { type: Sequelize.ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received'), allowNull: false, defaultValue: 'queued' },
    error_message: { type: Sequelize.TEXT, allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  }, tableOptions);
  await queryInterface.addIndex('messages', ['chat_id', 'created_at'], { name: 'idx_messages_chat_created' });
  await queryInterface.addIndex('messages', ['contact_id', 'created_at'], { name: 'idx_messages_contact_created' });
  await queryInterface.addIndex('messages', ['status'], { name: 'idx_messages_status' });

  await queryInterface.createTable('chat_assignments', {
    id: id(Sequelize),
    chat_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'chats', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    assigned_to_user_id: userFk(Sequelize, false),
    assigned_by_user_id: userFk(Sequelize),
    status: { type: Sequelize.ENUM('active', 'released', 'transferred'), allowNull: false, defaultValue: 'active' },
    note: { type: Sequelize.TEXT, allowNull: true },
    assigned_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    released_at: { type: Sequelize.DATE, allowNull: true },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('chat_assignments', ['chat_id', 'status'], { name: 'idx_chat_assignments_chat_status' });
  await queryInterface.addIndex('chat_assignments', ['assigned_to_user_id', 'status'], { name: 'idx_chat_assignments_user_status' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('chat_assignments');
  await queryInterface.dropTable('messages');
  await queryInterface.dropTable('chats');
  await queryInterface.dropTable('contact_tags');
  await queryInterface.dropTable('contacts');
}
