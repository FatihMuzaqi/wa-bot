import { DataTypes, Model } from 'sequelize';

export default class ChatAssignment extends Model {
  static initModel(sequelize) {
    ChatAssignment.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      chat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      assigned_to_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      assigned_by_user_id: DataTypes.BIGINT.UNSIGNED,
      status: { type: DataTypes.ENUM('active', 'released', 'transferred'), allowNull: false, defaultValue: 'active' },
      note: DataTypes.TEXT,
      assigned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      released_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'ChatAssignment',
      tableName: 'chat_assignments',
      underscored: true,
      indexes: [{ fields: ['chat_id', 'status'] }, { fields: ['assigned_to_user_id', 'status'] }],
    });
    return ChatAssignment;
  }
}
