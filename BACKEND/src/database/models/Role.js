import { DataTypes, Model } from 'sequelize';

export default class Role extends Model {
  static initModel(sequelize) {
    Role.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      description: DataTypes.STRING(255),
      is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, { sequelize, modelName: 'Role', tableName: 'roles', underscored: true });
    return Role;
  }
}
