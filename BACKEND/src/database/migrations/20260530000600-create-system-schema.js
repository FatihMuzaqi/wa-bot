const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };
const id = (Sequelize) => ({ type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false });
const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
});

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notifications', {
    id: id(Sequelize),
    user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: { type: Sequelize.STRING(150), allowNull: false },
    body: { type: Sequelize.TEXT, allowNull: true },
    notification_type: { type: Sequelize.STRING(80), allowNull: false },
    channel: { type: Sequelize.ENUM('in_app', 'email', 'push', 'webhook'), allowNull: false, defaultValue: 'in_app' },
    read_at: { type: Sequelize.DATE, allowNull: true },
    payload: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('notifications', ['user_id', 'read_at', 'created_at'], { name: 'idx_notifications_user_read_created' });

  await queryInterface.createTable('settings', {
    id: id(Sequelize),
    setting_key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
    setting_group: { type: Sequelize.STRING(80), allowNull: false },
    value: { type: Sequelize.JSON, allowNull: false },
    is_encrypted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    updated_by: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('settings', ['setting_group'], { name: 'idx_settings_group' });

  await queryInterface.createTable('audit_logs', {
    id: id(Sequelize),
    actor_user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    action: { type: Sequelize.STRING(100), allowNull: false },
    entity_type: { type: Sequelize.STRING(100), allowNull: false },
    entity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    ip_address: { type: Sequelize.STRING(80), allowNull: true },
    user_agent: { type: Sequelize.TEXT, allowNull: true },
    payload: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  }, tableOptions);
  await queryInterface.addIndex('audit_logs', ['actor_user_id', 'created_at'], { name: 'idx_audit_logs_actor_created' });
  await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], { name: 'idx_audit_logs_entity' });
  await queryInterface.addIndex('audit_logs', ['action', 'created_at'], { name: 'idx_audit_logs_action_created' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('audit_logs');
  await queryInterface.dropTable('settings');
  await queryInterface.dropTable('notifications');
}
