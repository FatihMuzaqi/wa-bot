import { DataTypes, Model } from 'sequelize';

export default class DocumentTemplate extends Model {
  static initModel(sequelize) {
    DocumentTemplate.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      template_type: { type: DataTypes.ENUM('pdf', 'image', 'html'), allowNull: false },
      category: DataTypes.STRING(100),
      template_schema: { type: DataTypes.JSON, allowNull: false },
      status: { type: DataTypes.ENUM('draft', 'active', 'archived'), allowNull: false, defaultValue: 'draft' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      deleted_at: DataTypes.DATE,
    }, { sequelize, modelName: 'DocumentTemplate', tableName: 'document_templates', underscored: true, paranoid: true, deletedAt: 'deleted_at' });
    return DocumentTemplate;
  }
}
