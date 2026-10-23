import { DataTypes, Model } from 'sequelize';

export default class Permission extends Model {
  static initModel(sequelize) {
    Permission.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      resource: { type: DataTypes.STRING(80), allowNull: false },
      action: { type: DataTypes.STRING(80), allowNull: false },
      scope: { type: DataTypes.ENUM('own', 'assigned', 'team', 'all'), allowNull: false, defaultValue: 'own' },
    }, {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      underscored: true,
      indexes: [{ unique: true, fields: ['role_id', 'resource', 'action'] }],
    });
    return Permission;
  }
}
