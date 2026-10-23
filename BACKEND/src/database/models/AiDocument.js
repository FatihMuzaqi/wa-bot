import { DataTypes, Model } from 'sequelize';

export default class AiDocument extends Model {
  static initModel(sequelize) {
    AiDocument.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      ai_knowledge_source_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      title: DataTypes.STRING(200),
      chunk_text: { type: DataTypes.TEXT, allowNull: false },
      chunk_hash: { type: DataTypes.STRING(64), allowNull: false },
      embedding_ref: DataTypes.STRING(255),
      token_count: DataTypes.INTEGER.UNSIGNED,
      metadata: DataTypes.JSON,
    }, { sequelize, modelName: 'AiDocument', tableName: 'ai_documents', underscored: true, indexes: [{ unique: true, fields: ['ai_knowledge_source_id', 'chunk_hash'] }] });
    return AiDocument;
  }
}
