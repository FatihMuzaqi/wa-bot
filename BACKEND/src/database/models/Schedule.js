import { DataTypes, Model } from 'sequelize';

export default class Schedule extends Model {
  static initModel(sequelize) {
    Schedule.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING(150), allowNull: false },
      message_payload: { type: DataTypes.JSON, allowNull: false },
      audience_filter: DataTypes.JSON,
      frequency: { type: DataTypes.ENUM('once', 'daily', 'weekly', 'monthly', 'custom'), allowNull: false, defaultValue: 'once' },
      cron_expression: DataTypes.STRING(120),
      timezone: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Asia/Jakarta' },
      next_run_at: DataTypes.DATE,
      last_run_at: DataTypes.DATE,
      status: { type: DataTypes.ENUM('active', 'paused', 'completed', 'failed'), allowNull: false, defaultValue: 'active' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      metadata: DataTypes.JSON,
      deleted_at: DataTypes.DATE,
    }, { sequelize, modelName: 'Schedule', tableName: 'schedules', underscored: true, paranoid: true, deletedAt: 'deleted_at' });
    return Schedule;
  }
}
