import { DataTypes, Model } from 'sequelize';

export default class FormSubmission extends Model {
  static initModel(sequelize) {
    FormSubmission.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      form_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      contact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      chat_id: DataTypes.BIGINT.UNSIGNED,
      status: { type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'), allowNull: false, defaultValue: 'in_progress' },
      operational_status: { type: DataTypes.ENUM('new', 'in_review', 'resolved'), allowNull: false, defaultValue: 'new' },
      notes: DataTypes.TEXT,
      started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      completed_at: DataTypes.DATE,
      forwarded_at: DataTypes.DATE,
      forward_status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), allowNull: true },
      forward_error: DataTypes.TEXT,
      metadata: DataTypes.JSON,
    }, { sequelize, modelName: 'FormSubmission', tableName: 'form_submissions', underscored: true });
    return FormSubmission;
  }
}
