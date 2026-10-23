export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('contacts', 'profile_picture_url', {
    type: Sequelize.STRING(500),
    allowNull: true,
    after: 'company',
  });

  await queryInterface.changeColumn('evolution_webhook_events', 'event_type', {
    type: Sequelize.ENUM('messages.upsert', 'messages.update', 'contacts.update', 'connection.update', 'qr.updated', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('evolution_webhook_events', 'event_type', {
    type: Sequelize.ENUM('message.upsert', 'messages.update', 'connection.update', 'qr.updated', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown',
  });

  await queryInterface.removeColumn('contacts', 'profile_picture_url');
}
