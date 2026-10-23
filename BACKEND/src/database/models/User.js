import { DataTypes, Model } from 'sequelize';

export default class User extends Model {
  static initModel(sequelize) {
    User.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: false, unique: true, validate: { isEmail: true } },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      phone: DataTypes.STRING(40),
      avatar_url: DataTypes.STRING(500),
      status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), allowNull: false, defaultValue: 'active' },
      last_login_at: DataTypes.DATE,
      metadata: DataTypes.JSON,
      deleted_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [{ fields: ['role_id'] }, { fields: ['status'] }],
    });
    return User;
  }
}
