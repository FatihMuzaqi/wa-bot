const tableOptions = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  engine: 'InnoDB',
};

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('user_sessions', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    refresh_token_hash: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },
    ip_address: {
      type: Sequelize.STRING(80),
      allowNull: true,
    },
    user_agent: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    revoked_at: {
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

  await queryInterface.addIndex('user_sessions', ['user_id', 'revoked_at'], {
    name: 'idx_user_sessions_user_revoked',
  });
  await queryInterface.addIndex('user_sessions', ['expires_at'], {
    name: 'idx_user_sessions_expires_at',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_sessions');
}
