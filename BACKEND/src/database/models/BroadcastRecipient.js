import { DataTypes, Model } from 'sequelize';

export default class BroadcastRecipient extends Model {
  static initModel(sequelize) {
    BroadcastRecipient.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      broadcast_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      contact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      message_id: DataTypes.BIGINT.UNSIGNED,
      evolution_message_id: DataTypes.STRING(191),
      status: { type: DataTypes.ENUM('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'skipped'), allowNull: false, defaultValue: 'pending' },
      error_message: DataTypes.TEXT,
      queued_at: DataTypes.DATE,
      sent_at: DataTypes.DATE,
      delivered_at: DataTypes.DATE,
      read_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'BroadcastRecipient',
      tableName: 'broadcast_recipients',
      underscored: true,
      indexes: [{ unique: true, fields: ['broadcast_id', 'contact_id'] }, { fields: ['broadcast_id', 'status'] }],
    });
    return BroadcastRecipient;
  }
}
