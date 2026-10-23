import { DataTypes, Model } from 'sequelize';

export default class BotMenu extends Model {
  static initModel(sequelize) {
    BotMenu.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      body_text: { type: DataTypes.TEXT, allowNull: false },
      footer_text: DataTypes.TEXT,
      unknown_text: { type: DataTypes.TEXT, allowNull: false },
      is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: DataTypes.BIGINT.UNSIGNED,
      deleted_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'BotMenu',
      tableName: 'bot_menus',
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [
        { fields: ['is_default', 'is_active'] },
        { fields: ['deleted_at'] },
      ],
    });
    return BotMenu;
  }
}
