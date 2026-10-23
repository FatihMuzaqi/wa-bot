const tableOptions = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  engine: 'InnoDB',
};

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ai_interactions', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    chat_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'chats', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    message_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'messages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    ai_prompt_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'ai_prompts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    provider: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'openai' },
    model: { type: Sequelize.STRING(100), allowNull: true },
    prompt_type: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'system' },
    question: { type: Sequelize.TEXT, allowNull: false },
    answer: { type: Sequelize.TEXT, allowNull: true },
    confidence: { type: Sequelize.DECIMAL(5, 4), allowNull: true },
    should_fallback: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    fallback_reason: { type: Sequelize.STRING(255), allowNull: true },
    conversation_context: { type: Sequelize.JSON, allowNull: true },
    knowledge_context: { type: Sequelize.JSON, allowNull: true },
    sources: { type: Sequelize.JSON, allowNull: true },
    request_payload: { type: Sequelize.JSON, allowNull: true },
    response_payload: { type: Sequelize.JSON, allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  }, tableOptions);

  await queryInterface.addIndex('ai_interactions', ['chat_id', 'created_at'], { name: 'idx_ai_interactions_chat_created' });
  await queryInterface.addIndex('ai_interactions', ['message_id'], { name: 'idx_ai_interactions_message' });
  await queryInterface.addIndex('ai_interactions', ['provider', 'created_at'], { name: 'idx_ai_interactions_provider_created' });
  await queryInterface.addIndex('ai_interactions', ['should_fallback'], { name: 'idx_ai_interactions_fallback' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ai_interactions');
}
