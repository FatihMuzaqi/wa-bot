import { DataTypes, Model } from 'sequelize';

export default class Message extends Model {
  static initModel(sequelize) {
    Message.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      chat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      contact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      sender_user_id: DataTypes.BIGINT.UNSIGNED,
      sender_type: { type: DataTypes.ENUM('contact', 'agent', 'bot', 'ai', 'system'), allowNull: false },
      direction: { type: DataTypes.ENUM('inbound', 'outbound', 'internal'), allowNull: false },
      message_type: { type: DataTypes.ENUM('text', 'image', 'document', 'audio', 'video', 'button', 'template', 'location'), allowNull: false, defaultValue: 'text' },
      content: DataTypes.TEXT,
      media_url: DataTypes.STRING(500),
      instance_name: DataTypes.STRING(191),
      evolution_message_id: { type: DataTypes.STRING(191), unique: true },
      message_timestamp: DataTypes.DATE,
      status: { type: DataTypes.ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received'), allowNull: false, defaultValue: 'queued' },
      error_message: DataTypes.TEXT,
      metadata: DataTypes.JSON,
    }, {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      underscored: true,
      indexes: [{ fields: ['chat_id', 'created_at'] }, { fields: ['contact_id', 'created_at'] }, { fields: ['instance_name'] }, { fields: ['status'] }],
    });
    return Message;
  }
}
