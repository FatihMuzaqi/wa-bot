const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };
const id = (Sequelize) => ({ type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false });
const fk = (Sequelize, model, allowNull = false, onDelete = 'CASCADE') => ({
  type: Sequelize.BIGINT.UNSIGNED,
  allowNull,
  references: { model, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete,
});
const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
});

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ai_knowledge_sources', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    source_type: { type: Sequelize.ENUM('document', 'faq', 'article', 'url', 'custom'), allowNull: false },
    status: { type: Sequelize.ENUM('processing', 'active', 'failed', 'archived'), allowNull: false, defaultValue: 'processing' },
    source_url: { type: Sequelize.STRING(500), allowNull: true },
    raw_content: { type: Sequelize.TEXT('long'), allowNull: true },
    item_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    last_indexed_at: { type: Sequelize.DATE, allowNull: true },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    metadata: { type: Sequelize.JSON, allowNull: true },
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('ai_knowledge_sources', ['status', 'source_type'], { name: 'idx_ai_knowledge_sources_status_type' });

  await queryInterface.createTable('ai_documents', {
    id: id(Sequelize),
    ai_knowledge_source_id: fk(Sequelize, 'ai_knowledge_sources'),
    title: { type: Sequelize.STRING(200), allowNull: true },
    chunk_text: { type: Sequelize.TEXT, allowNull: false },
    chunk_hash: { type: Sequelize.STRING(64), allowNull: false },
    embedding_ref: { type: Sequelize.STRING(255), allowNull: true },
    token_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  }, tableOptions);
  await queryInterface.addIndex('ai_documents', ['ai_knowledge_source_id', 'chunk_hash'], {
    unique: true,
    name: 'uq_ai_documents_source_hash',
  });

  await queryInterface.createTable('ai_prompts', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    prompt_type: { type: Sequelize.ENUM('system', 'handoff', 'summary', 'classification'), allowNull: false, defaultValue: 'system' },
    content: { type: Sequelize.TEXT, allowNull: false },
    model: { type: Sequelize.STRING(100), allowNull: true },
    temperature: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 0.70 },
    confidence_threshold: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 0.75 },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('ai_prompts', ['prompt_type', 'is_active'], { name: 'idx_ai_prompts_type_active' });

  await queryInterface.createTable('automation_workflows', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    provider: { type: Sequelize.ENUM('n8n', 'internal', 'webhook'), allowNull: false, defaultValue: 'n8n' },
    external_workflow_id: { type: Sequelize.STRING(191), allowNull: true },
    trigger_event: { type: Sequelize.STRING(100), allowNull: false },
    webhook_url: { type: Sequelize.STRING(500), allowNull: true },
    secret_hash: { type: Sequelize.STRING(255), allowNull: true },
    status: { type: Sequelize.ENUM('active', 'paused', 'disabled'), allowNull: false, defaultValue: 'active' },
    success_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    failure_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    last_run_at: { type: Sequelize.DATE, allowNull: true },
    config: { type: Sequelize.JSON, allowNull: true },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('automation_workflows', ['trigger_event', 'status'], { name: 'idx_automation_workflows_trigger_status' });
  await queryInterface.addIndex('automation_workflows', ['external_workflow_id'], { name: 'idx_automation_workflows_external_id' });

  await queryInterface.createTable('document_templates', {
    id: id(Sequelize),
    name: { type: Sequelize.STRING(150), allowNull: false },
    template_type: { type: Sequelize.ENUM('pdf', 'image', 'html'), allowNull: false },
    category: { type: Sequelize.STRING(100), allowNull: true },
    template_schema: { type: Sequelize.JSON, allowNull: false },
    status: { type: Sequelize.ENUM('draft', 'active', 'archived'), allowNull: false, defaultValue: 'draft' },
    created_by: fk(Sequelize, 'users', true, 'SET NULL'),
    ...timestamps(Sequelize),
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  }, tableOptions);
  await queryInterface.addIndex('document_templates', ['template_type', 'status'], { name: 'idx_document_templates_type_status' });

  await queryInterface.createTable('generated_documents', {
    id: id(Sequelize),
    document_template_id: fk(Sequelize, 'document_templates'),
    contact_id: fk(Sequelize, 'contacts', true, 'SET NULL'),
    generated_by: fk(Sequelize, 'users', true, 'SET NULL'),
    file_url: { type: Sequelize.STRING(500), allowNull: false },
    dynamic_data: { type: Sequelize.JSON, allowNull: true },
    status: { type: Sequelize.ENUM('generated', 'sent', 'failed'), allowNull: false, defaultValue: 'generated' },
    error_message: { type: Sequelize.TEXT, allowNull: true },
    sent_at: { type: Sequelize.DATE, allowNull: true },
    ...timestamps(Sequelize),
  }, tableOptions);
  await queryInterface.addIndex('generated_documents', ['document_template_id', 'created_at'], { name: 'idx_generated_documents_template_created' });
  await queryInterface.addIndex('generated_documents', ['contact_id', 'created_at'], { name: 'idx_generated_documents_contact_created' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('generated_documents');
  await queryInterface.dropTable('document_templates');
  await queryInterface.dropTable('automation_workflows');
  await queryInterface.dropTable('ai_prompts');
  await queryInterface.dropTable('ai_documents');
  await queryInterface.dropTable('ai_knowledge_sources');
}
