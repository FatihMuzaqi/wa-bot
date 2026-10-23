const tableOptions = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  engine: 'InnoDB',
};

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('evolution_webhook_events', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    event_key: {
      type: Sequelize.STRING(191),
      allowNull: false,
      unique: true,
    },
    event_type: {
      type: Sequelize.ENUM('message.upsert', 'messages.update', 'connection.update', 'qr.updated', 'unknown'),
      allowNull: false,
      defaultValue: 'unknown',
    },
    instance_name: {
      type: Sequelize.STRING(191),
      allowNull: true,
    },
    external_message_id: {
      type: Sequelize.STRING(191),
      allowNull: true,
    },
    connection_state: {
      type: Sequelize.STRING(80),
      allowNull: true,
    },
    payload: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    duplicate_count: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    received_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    processed_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
  }, tableOptions);

  await queryInterface.addIndex('evolution_webhook_events', ['event_type', 'received_at'], {
    name: 'idx_evolution_webhook_events_type_received',
  });
  await queryInterface.addIndex('evolution_webhook_events', ['instance_name', 'received_at'], {
    name: 'idx_evolution_webhook_events_instance_received',
  });
  await queryInterface.addIndex('evolution_webhook_events', ['external_message_id'], {
    name: 'idx_evolution_webhook_events_external_message',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('evolution_webhook_events');
}
