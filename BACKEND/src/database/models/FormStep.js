import { DataTypes, Model } from 'sequelize';

export default class FormStep extends Model {
  static initModel(sequelize) {
    FormStep.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      form_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      step_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      question: { type: DataTypes.TEXT, allowNull: false },
      input_type: { type: DataTypes.ENUM('text', 'email', 'number', 'choice', 'date', 'file', 'phone'), allowNull: false },
      options: DataTypes.JSON,
      validation_rules: DataTypes.JSON,
      is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, { sequelize, modelName: 'FormStep', tableName: 'form_steps', underscored: true, indexes: [{ unique: true, fields: ['form_id', 'step_order'] }] });
    return FormStep;
  }
}
