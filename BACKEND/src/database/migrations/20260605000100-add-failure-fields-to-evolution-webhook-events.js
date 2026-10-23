export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('evolution_webhook_events', 'failed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });

  await queryInterface.addColumn('evolution_webhook_events', 'error_message', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('evolution_webhook_events', 'error_message');
  await queryInterface.removeColumn('evolution_webhook_events', 'failed_at');
}
