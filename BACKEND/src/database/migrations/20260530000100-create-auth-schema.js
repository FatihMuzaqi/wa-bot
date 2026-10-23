const tableOptions = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  engine: 'InnoDB',
};

const id = (Sequelize) => ({
  type: Sequelize.BIGINT.UNSIGNED,
  autoIncrement: true,
  primaryKey: true,
  allowNull: false,
});

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
  },
});

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('roles', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    description: { type: Sequelize.STRING(255), allowNull: true },
    is_system: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    ...timestamps(Sequelize),
  }, tableOptions);

  await queryInterface.createTable('permissions', {
    id: id(Sequelize),
    role_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    resource: { type: Sequelize.STRING(80), allowNull: false },
    action: { type: Sequelize.STRING(80), allowNull: false },
    scope: { type: Sequelize.ENUM('own', 'assigned', 'team', 'all'), allowNull: false, defaultValue: 'own' },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('permissions', ['role_id', 'resource', 'action'], {
    unique: true,
    name: 'uq_permissions_role_resource_action',
  });

  await queryInterface.createTable('users', {
    id: id(Sequelize),
    role_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    name: { type: Sequelize.STRING(120), allowNull: false },
    email: { type: Sequelize.STRING(191), allowNull: false, unique: true },
    password_hash: { type: Sequelize.STRING(255), allowNull: false },
    phone: { type: Sequelize.STRING(40), allowNull: true },
    avatar_url: { type: Sequelize.STRING(500), allowNull: true },
    status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), allowNull: false, defaultValue: 'active' },
    last_login_at: { type: Sequelize.DATE, allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('users', ['role_id'], { name: 'idx_users_role_id' });
  await queryInterface.addIndex('users', ['status'], { name: 'idx_users_status' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('users');
  await queryInterface.dropTable('permissions');
  await queryInterface.dropTable('roles');
}
