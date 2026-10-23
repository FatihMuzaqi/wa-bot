import { DataTypes, Model } from 'sequelize';

export default class FormAnswer extends Model {
  static initModel(sequelize) {
    FormAnswer.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      form_submission_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      form_step_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      answer: DataTypes.TEXT,
      answer_json: DataTypes.JSON,
    }, { sequelize, modelName: 'FormAnswer', tableName: 'form_answers', underscored: true, indexes: [{ unique: true, fields: ['form_submission_id', 'form_step_id'] }] });
    return FormAnswer;
  }
}
