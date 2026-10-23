import { DataTypes, Model } from 'sequelize';

export default class Form extends Model {
  static initModel(sequelize) {
    Form.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: DataTypes.TEXT,
      status: { type: DataTypes.ENUM('draft', 'active', 'inactive', 'archived'), allowNull: false, defaultValue: 'draft' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      deleted_at: DataTypes.DATE,
    }, { sequelize, modelName: 'Form', tableName: 'forms', underscored: true, paranoid: true, deletedAt: 'deleted_at' });
    return Form;
  }
}
