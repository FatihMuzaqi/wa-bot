import { DataTypes, Model } from 'sequelize';

export default class AiKnowledgeSource extends Model {
  static initModel(sequelize) {
    AiKnowledgeSource.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      source_type: { type: DataTypes.ENUM('document', 'faq', 'article', 'url', 'custom'), allowNull: false },
      status: { type: DataTypes.ENUM('processing', 'active', 'failed', 'archived'), allowNull: false, defaultValue: 'processing' },
      source_url: DataTypes.STRING(500),
      raw_content: DataTypes.TEXT('long'),
      item_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      last_indexed_at: DataTypes.DATE,
      created_by: DataTypes.BIGINT.UNSIGNED,
      metadata: DataTypes.JSON,
      deleted_at: DataTypes.DATE,
    }, { sequelize, modelName: 'AiKnowledgeSource', tableName: 'ai_knowledge_sources', underscored: true, paranoid: true, deletedAt: 'deleted_at' });
    return AiKnowledgeSource;
  }
}
