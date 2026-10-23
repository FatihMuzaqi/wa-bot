import { DataTypes, Model } from 'sequelize';

export default class AuditLog extends Model {
  static initModel(sequelize) {
    AuditLog.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      actor_user_id: DataTypes.BIGINT.UNSIGNED,
      action: { type: DataTypes.STRING(100), allowNull: false },
      entity_type: { type: DataTypes.STRING(100), allowNull: false },
      entity_id: DataTypes.BIGINT.UNSIGNED,
      ip_address: DataTypes.STRING(80),
      user_agent: DataTypes.TEXT,
      payload: DataTypes.JSON,
    }, { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', underscored: true, updatedAt: false });
    return AuditLog;
  }
}
