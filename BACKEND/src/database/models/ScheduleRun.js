import { DataTypes, Model } from 'sequelize';

export default class ScheduleRun extends Model {
  static initModel(sequelize) {
    ScheduleRun.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      schedule_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      broadcast_id: DataTypes.BIGINT.UNSIGNED,
      status: { type: DataTypes.ENUM('running', 'success', 'failed'), allowNull: false, defaultValue: 'running' },
      run_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      error_message: DataTypes.TEXT,
      metadata: DataTypes.JSON,
    }, {
      sequelize,
      modelName: 'ScheduleRun',
      tableName: 'schedule_runs',
      underscored: true,
      indexes: [
        { fields: ['schedule_id', 'run_at'] },
        { fields: ['status'] },
      ],
    });
    return ScheduleRun;
  }
}
