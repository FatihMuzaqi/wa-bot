import { DataTypes, Model } from 'sequelize';

export default class AiPrompt extends Model {
  static initModel(sequelize) {
    AiPrompt.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      prompt_type: { type: DataTypes.ENUM('system', 'handoff', 'summary', 'classification'), allowNull: false, defaultValue: 'system' },
      content: { type: DataTypes.TEXT, allowNull: false },
      model: DataTypes.STRING(100),
      temperature: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 0.70 },
      confidence_threshold: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 0.75 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: DataTypes.BIGINT.UNSIGNED,
    }, { sequelize, modelName: 'AiPrompt', tableName: 'ai_prompts', underscored: true });
    return AiPrompt;
  }
}
