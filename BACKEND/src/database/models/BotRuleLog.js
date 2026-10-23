import { DataTypes, Model } from 'sequelize';

export default class BotRuleLog extends Model {
  static initModel(sequelize) {
    BotRuleLog.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      bot_rule_id: DataTypes.BIGINT.UNSIGNED,
      chat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      message_id: DataTypes.BIGINT.UNSIGNED,
      matched_text: DataTypes.TEXT,
      response_status: { type: DataTypes.ENUM('matched', 'sent', 'failed', 'skipped'), allowNull: false, defaultValue: 'matched' },
      metadata: DataTypes.JSON,
    }, { sequelize, modelName: 'BotRuleLog', tableName: 'bot_rule_logs', underscored: true, updatedAt: false });
    return BotRuleLog;
  }
}
