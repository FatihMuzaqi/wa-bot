export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('bot_menus', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(150), allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: false },
    body_text: { type: Sequelize.TEXT, allowNull: false },
    footer_text: { type: Sequelize.TEXT, allowNull: true },
    unknown_text: { type: Sequelize.TEXT, allowNull: false },
    is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });

  await queryInterface.addIndex('bot_menus', ['is_default', 'is_active'], { name: 'idx_bot_menus_default_active' });
  await queryInterface.addIndex('bot_menus', ['deleted_at'], { name: 'idx_bot_menus_deleted_at' });

  await queryInterface.createTable('bot_menu_items', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    bot_menu_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'bot_menus', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    number: { type: Sequelize.STRING(10), allowNull: false },
    title: { type: Sequelize.STRING(150), allowNull: false },
    description: { type: Sequelize.STRING(255), allowNull: true },
    action_type: { type: Sequelize.ENUM('trigger', 'form', 'text', 'transfer', 'ai'), allowNull: false },
    trigger_value: { type: Sequelize.STRING(255), allowNull: true },
    form_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'forms', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    response_text: { type: Sequelize.TEXT, allowNull: true },
    sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  });

  await queryInterface.addIndex('bot_menu_items', ['bot_menu_id', 'number'], {
    name: 'idx_bot_menu_items_menu_number',
  });
  await queryInterface.addIndex('bot_menu_items', ['bot_menu_id', 'sort_order'], {
    name: 'idx_bot_menu_items_menu_sort',
  });
  await queryInterface.addIndex('bot_menu_items', ['action_type'], {
    name: 'idx_bot_menu_items_action_type',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('bot_menu_items');
  await queryInterface.dropTable('bot_menus');
};
