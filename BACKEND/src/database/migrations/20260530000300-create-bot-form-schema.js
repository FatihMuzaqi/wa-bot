const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };
const id = (Sequelize) => ({ type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false });
const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
});
const fk = (Sequelize, model, allowNull = false, onDelete = 'CASCADE') => ({
  type: Sequelize.BIGINT.UNSIGNED,
  allowNull,
  references: { model, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete,
});

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('forms', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.ENUM('draft', 'active', 'inactive', 'archived'), allowNull: false, defaultValue: 'draft' },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('forms', ['status'], { name: 'idx_forms_status' });

  await queryInterface.createTable('form_steps', {
    id: id(Sequelize),
    form_id: fk(Sequelize, 'forms'),
    step_order: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
    question: { type: Sequelize.TEXT, allowNull: false },
    input_type: { type: Sequelize.ENUM('text', 'email', 'number', 'choice', 'date', 'file', 'phone'), allowNull: false },
    options: { type: Sequelize.JSON, allowNull: true },
    validation_rules: { type: Sequelize.JSON, allowNull: true },
    is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('form_steps', ['form_id', 'step_order'], { unique: true, name: 'uq_form_steps_form_order' });

  await queryInterface.createTable('bot_rules', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    trigger_type: { type: Sequelize.ENUM('keyword', 'regex', 'intent'), allowNull: false },
    trigger_value: { type: Sequelize.TEXT, allowNull: false },
    response_type: { type: Sequelize.ENUM('text', 'buttons', 'form', 'transfer', 'webhook', 'ai'), allowNull: false },
    response_payload: { type: Sequelize.JSON, allowNull: false },
    priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    ai_fallback_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    form_id: fk(Sequelize, 'forms', true, 'SET NULL'),
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('bot_rules', ['is_active', 'priority'], { name: 'idx_bot_rules_active_priority' });
  await queryInterface.addIndex('bot_rules', ['trigger_type'], { name: 'idx_bot_rules_trigger_type' });

  await queryInterface.createTable('bot_rule_logs', {
    id: id(Sequelize),
    bot_rule_id: fk(Sequelize, 'bot_rules', true, 'SET NULL'),
    chat_id: fk(Sequelize, 'chats'),
    message_id: fk(Sequelize, 'messages', true, 'SET NULL'),
    matched_text: { type: Sequelize.TEXT, allowNull: true },
    response_status: { type: Sequelize.ENUM('matched', 'sent', 'failed', 'skipped'), allowNull: false, defaultValue: 'matched' },
    metadata: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  }, tableOptions);
  await queryInterface.addIndex('bot_rule_logs', ['bot_rule_id', 'created_at'], { name: 'idx_bot_rule_logs_rule_created' });
  await queryInterface.addIndex('bot_rule_logs', ['chat_id', 'created_at'], { name: 'idx_bot_rule_logs_chat_created' });

  await queryInterface.createTable('form_submissions', {
    id: id(Sequelize),
    form_id: fk(Sequelize, 'forms'),
    contact_id: fk(Sequelize, 'contacts'),
    chat_id: fk(Sequelize, 'chats', true, 'SET NULL'),
    status: { type: Sequelize.ENUM('in_progress', 'completed', 'abandoned'), allowNull: false, defaultValue: 'in_progress' },
    started_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    completed_at: { type: Sequelize.DATE, allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('form_submissions', ['form_id', 'status'], { name: 'idx_form_submissions_form_status' });
  await queryInterface.addIndex('form_submissions', ['contact_id', 'created_at'], { name: 'idx_form_submissions_contact_created' });

  await queryInterface.createTable('form_answers', {
    id: id(Sequelize),
    form_submission_id: fk(Sequelize, 'form_submissions'),
    form_step_id: fk(Sequelize, 'form_steps'),
    answer: { type: Sequelize.TEXT, allowNull: true },
    answer_json: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  }, tableOptions);
  await queryInterface.addIndex('form_answers', ['form_submission_id', 'form_step_id'], {
    unique: true,
    name: 'uq_form_answers_submission_step',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('form_answers');
  await queryInterface.dropTable('form_submissions');
  await queryInterface.dropTable('bot_rule_logs');
  await queryInterface.dropTable('bot_rules');
  await queryInterface.dropTable('form_steps');
  await queryInterface.dropTable('forms');
}
