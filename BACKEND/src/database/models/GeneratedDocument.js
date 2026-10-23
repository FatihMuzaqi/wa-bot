import { DataTypes, Model } from 'sequelize';

export default class GeneratedDocument extends Model {
  static initModel(sequelize) {
    GeneratedDocument.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      document_template_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      contact_id: DataTypes.BIGINT.UNSIGNED,
      generated_by: DataTypes.BIGINT.UNSIGNED,
      file_url: { type: DataTypes.STRING(500), allowNull: false },
      dynamic_data: DataTypes.JSON,
      status: { type: DataTypes.ENUM('generated', 'sent', 'failed'), allowNull: false, defaultValue: 'generated' },
      error_message: DataTypes.TEXT,
      sent_at: DataTypes.DATE,
    }, { sequelize, modelName: 'GeneratedDocument', tableName: 'generated_documents', underscored: true });
    return GeneratedDocument;
  }
}
