export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query("UPDATE chats SET status = 'open' WHERE status = 'human'");

  await queryInterface.changeColumn('chats', 'status', {
    type: Sequelize.ENUM('open', 'pending', 'closed', 'bot'),
    allowNull: false,
    defaultValue: 'bot',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('chats', 'status', {
    type: Sequelize.ENUM('bot', 'pending', 'human', 'closed'),
    allowNull: false,
    defaultValue: 'bot',
  });

  await queryInterface.sequelize.query("UPDATE chats SET status = 'human' WHERE status = 'open'");
}
