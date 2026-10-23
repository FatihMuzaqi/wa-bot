import { DataTypes, Model } from 'sequelize';

export default class Chat extends Model {
  static initModel(sequelize) {
    Chat.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      contact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      assigned_agent_id: DataTypes.BIGINT.UNSIGNED,
      status: { type: DataTypes.ENUM('open', 'pending', 'closed', 'bot'), allowNull: false, defaultValue: 'bot' },
      priority: { type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'), allowNull: false, defaultValue: 'normal' },
      ai_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      unread_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      last_message_at: DataTypes.DATE,
      closed_at: DataTypes.DATE,
      metadata: DataTypes.JSON,
    }, {
      sequelize,
      modelName: 'Chat',
      tableName: 'chats',
      underscored: true,
      indexes: [{ fields: ['contact_id'] }, { fields: ['assigned_agent_id', 'status'] }, { fields: ['status', 'last_message_at'] }],
    });
    return Chat;
  }
}
