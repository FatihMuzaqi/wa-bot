import { DataTypes, Model } from 'sequelize';

export default class Notification extends Model {
  static initModel(sequelize) {
    Notification.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: DataTypes.BIGINT.UNSIGNED,
      title: { type: DataTypes.STRING(150), allowNull: false },
      body: DataTypes.TEXT,
      notification_type: { type: DataTypes.STRING(80), allowNull: false },
      channel: { type: DataTypes.ENUM('in_app', 'email', 'push', 'webhook'), allowNull: false, defaultValue: 'in_app' },
      read_at: DataTypes.DATE,
      payload: DataTypes.JSON,
    }, { sequelize, modelName: 'Notification', tableName: 'notifications', underscored: true });
    return Notification;
  }
}
