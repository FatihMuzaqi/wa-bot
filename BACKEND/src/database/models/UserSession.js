import { DataTypes, Model } from 'sequelize';

export default class UserSession extends Model {
  static initModel(sequelize) {
    UserSession.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      refresh_token_hash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      ip_address: DataTypes.STRING(80),
      user_agent: DataTypes.TEXT,
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'UserSession',
      tableName: 'user_sessions',
      underscored: true,
      indexes: [
        { fields: ['user_id', 'revoked_at'] },
        { fields: ['expires_at'] },
      ],
    });
    return UserSession;
  }
}
