const tableOptions = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  engine: 'InnoDB',
};

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('schedule_runs', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    schedule_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'schedules', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    broadcast_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'broadcasts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    status: {
      type: Sequelize.ENUM('running', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'running',
    },
    run_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    error_message: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    metadata: {
      type: Sequelize.JSON,
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

  await queryInterface.addIndex('schedule_runs', ['schedule_id', 'run_at'], {
    name: 'idx_schedule_runs_schedule_run_at',
  });
  await queryInterface.addIndex('schedule_runs', ['status'], {
    name: 'idx_schedule_runs_status',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('schedule_runs');
}
