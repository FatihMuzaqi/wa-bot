import { DataTypes, Model } from 'sequelize';

export default class BotMenuItem extends Model {
  static initModel(sequelize) {
    BotMenuItem.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      bot_menu_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      number: { type: DataTypes.STRING(10), allowNull: false },
      title: { type: DataTypes.STRING(150), allowNull: false },
      description: DataTypes.STRING(255),
      action_type: { type: DataTypes.ENUM('trigger', 'form', 'text', 'transfer', 'ai'), allowNull: false },
      trigger_value: DataTypes.STRING(255),
      form_id: DataTypes.BIGINT.UNSIGNED,
      response_text: DataTypes.TEXT,
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
      sequelize,
      modelName: 'BotMenuItem',
      tableName: 'bot_menu_items',
      underscored: true,
      indexes: [
        { fields: ['bot_menu_id', 'number'] },
        { fields: ['bot_menu_id', 'sort_order'] },
        { fields: ['action_type'] },
      ],
    });
    return BotMenuItem;
  }
}
