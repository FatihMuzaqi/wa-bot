import { DataTypes, Model } from 'sequelize';

export default class Setting extends Model {
  static initModel(sequelize) {
    Setting.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      setting_key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      setting_group: { type: DataTypes.STRING(80), allowNull: false },
      value: { type: DataTypes.JSON, allowNull: false },
      is_encrypted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      updated_by: DataTypes.BIGINT.UNSIGNED,
    }, { sequelize, modelName: 'Setting', tableName: 'settings', underscored: true });
    return Setting;
  }
}
