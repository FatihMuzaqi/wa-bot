const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };
const id = (Sequelize) => ({ type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false });
const fk = (Sequelize, model, allowNull = false, onDelete = 'CASCADE') => ({
  type: Sequelize.BIGINT.UNSIGNED,
  allowNull,
  references: { model, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete,
});
const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
});

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('broadcasts', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    message_type: { type: Sequelize.ENUM('text', 'media', 'template'), allowNull: false, defaultValue: 'text' },
    message_payload: { type: Sequelize.JSON, allowNull: false },
    audience_filter: { type: Sequelize.JSON, allowNull: true },
    status: {
      type: Sequelize.ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduled_at: { type: Sequelize.DATE, allowNull: true },
    started_at: { type: Sequelize.DATE, allowNull: true },
    completed_at: { type: Sequelize.DATE, allowNull: true },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('broadcasts', ['status', 'scheduled_at'], { name: 'idx_broadcasts_status_scheduled' });
  await queryInterface.addIndex('broadcasts', ['created_by', 'created_at'], { name: 'idx_broadcasts_created_by_created' });

  await queryInterface.createTable('broadcast_recipients', {
    id: id(Sequelize),
    broadcast_id: fk(Sequelize, 'broadcasts'),
    contact_id: fk(Sequelize, 'contacts'),
    message_id: fk(Sequelize, 'messages', true, 'SET NULL'),
    status: {
      type: Sequelize.ENUM('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'skipped'),
      allowNull: false,
      defaultValue: 'pending',
    },
    error_message: { type: Sequelize.TEXT, allowNull: true },
    queued_at: { type: Sequelize.DATE, allowNull: true },
    sent_at: { type: Sequelize.DATE, allowNull: true },
    delivered_at: { type: Sequelize.DATE, allowNull: true },
    read_at: { type: Sequelize.DATE, allowNull: true },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('broadcast_recipients', ['broadcast_id', 'contact_id'], {
    unique: true,
    name: 'uq_broadcast_recipients_broadcast_contact',
  });
  await queryInterface.addIndex('broadcast_recipients', ['broadcast_id', 'status'], { name: 'idx_broadcast_recipients_broadcast_status' });
  await queryInterface.addIndex('broadcast_recipients', ['message_id'], { name: 'idx_broadcast_recipients_message_id' });

  await queryInterface.createTable('broadcast_logs', {
    id: id(Sequelize),
    broadcast_id: fk(Sequelize, 'broadcasts'),
    broadcast_recipient_id: fk(Sequelize, 'broadcast_recipients', true, 'SET NULL'),
    event_type: { type: Sequelize.STRING(80), allowNull: false },
    payload: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  }, tableOptions);
  await queryInterface.addIndex('broadcast_logs', ['broadcast_id', 'created_at'], { name: 'idx_broadcast_logs_broadcast_created' });

  await queryInterface.createTable('schedules', {
    id: id(Sequelize),
    title: { type: Sequelize.STRING(150), allowNull: false },
    message_payload: { type: Sequelize.JSON, allowNull: false },
    audience_filter: { type: Sequelize.JSON, allowNull: true },
    frequency: { type: Sequelize.ENUM('once', 'daily', 'weekly', 'monthly', 'custom'), allowNull: false, defaultValue: 'once' },
    cron_expression: { type: Sequelize.STRING(120), allowNull: true },
    timezone: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'Asia/Jakarta' },
    next_run_at: { type: Sequelize.DATE, allowNull: true },
    last_run_at: { type: Sequelize.DATE, allowNull: true },
    status: { type: Sequelize.ENUM('active', 'paused', 'completed', 'failed'), allowNull: false, defaultValue: 'active' },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('schedules', ['status', 'next_run_at'], { name: 'idx_schedules_status_next_run' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('schedules');
  await queryInterface.dropTable('broadcast_logs');
  await queryInterface.dropTable('broadcast_recipients');
  await queryInterface.dropTable('broadcasts');
}
