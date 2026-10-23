export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('messages', 'instance_name', {
    type: Sequelize.STRING(191),
    allowNull: true,
    after: 'media_url',
  });

  await queryInterface.addColumn('messages', 'message_timestamp', {
    type: Sequelize.DATE,
    allowNull: true,
    after: 'evolution_message_id',
  });

  await queryInterface.addIndex('messages', ['instance_name'], {
    name: 'idx_messages_instance_name',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('messages', 'idx_messages_instance_name');
  await queryInterface.removeColumn('messages', 'message_timestamp');
  await queryInterface.removeColumn('messages', 'instance_name');
}
