import { DataTypes, Model } from 'sequelize';

export default class BotRule extends Model {
  static initModel(sequelize) {
    BotRule.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      trigger_type: { type: DataTypes.ENUM('keyword', 'regex', 'intent'), allowNull: false },
      trigger_value: { type: DataTypes.TEXT, allowNull: false },
      response_type: { type: DataTypes.ENUM('text', 'buttons', 'form', 'transfer', 'webhook', 'ai'), allowNull: false },
      response_payload: { type: DataTypes.JSON, allowNull: false },
      priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ai_fallback_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      form_id: DataTypes.BIGINT.UNSIGNED,
      created_by: DataTypes.BIGINT.UNSIGNED,
      deleted_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'BotRule',
      tableName: 'bot_rules',
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [{ fields: ['is_active', 'priority'] }, { fields: ['trigger_type'] }],
    });
    return BotRule;
  }
}
