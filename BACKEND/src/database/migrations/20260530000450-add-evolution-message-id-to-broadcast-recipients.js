export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('broadcast_recipients', 'evolution_message_id', {
    type: Sequelize.STRING(191),
    allowNull: true,
    after: 'message_id',
  });

  await queryInterface.addIndex('broadcast_recipients', ['evolution_message_id'], {
    name: 'idx_broadcast_recipients_evolution_message_id',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('broadcast_recipients', 'idx_broadcast_recipients_evolution_message_id');
  await queryInterface.removeColumn('broadcast_recipients', 'evolution_message_id');
}
