import { DataTypes, Model } from 'sequelize';

export default class Broadcast extends Model {
  static initModel(sequelize) {
    Broadcast.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      message_type: { type: DataTypes.ENUM('text', 'media', 'template'), allowNull: false, defaultValue: 'text' },
      message_payload: { type: DataTypes.JSON, allowNull: false },
      audience_filter: DataTypes.JSON,
      status: { type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'), allowNull: false, defaultValue: 'draft' },
      scheduled_at: DataTypes.DATE,
      started_at: DataTypes.DATE,
      completed_at: DataTypes.DATE,
      created_by: DataTypes.BIGINT.UNSIGNED,
      metadata: DataTypes.JSON,
      deleted_at: DataTypes.DATE,
    }, { sequelize, modelName: 'Broadcast', tableName: 'broadcasts', underscored: true, paranoid: true, deletedAt: 'deleted_at' });
    return Broadcast;
  }
}
