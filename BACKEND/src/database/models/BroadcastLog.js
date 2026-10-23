import { DataTypes, Model } from 'sequelize';

export default class BroadcastLog extends Model {
  static initModel(sequelize) {
    BroadcastLog.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      broadcast_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      broadcast_recipient_id: DataTypes.BIGINT.UNSIGNED,
      event_type: { type: DataTypes.STRING(80), allowNull: false },
      payload: DataTypes.JSON,
    }, { sequelize, modelName: 'BroadcastLog', tableName: 'broadcast_logs', underscored: true, updatedAt: false });
    return BroadcastLog;
  }
}
