import { DataTypes, Model } from 'sequelize';

export default class AiInteraction extends Model {
  static initModel(sequelize) {
    AiInteraction.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      chat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      ai_prompt_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      provider: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'openai' },
      model: { type: DataTypes.STRING(100), allowNull: true },
      prompt_type: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'system' },
      question: { type: DataTypes.TEXT, allowNull: false },
      answer: { type: DataTypes.TEXT, allowNull: true },
      confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
      should_fallback: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      fallback_reason: { type: DataTypes.STRING(255), allowNull: true },
      conversation_context: { type: DataTypes.JSON, allowNull: true },
      knowledge_context: { type: DataTypes.JSON, allowNull: true },
      sources: { type: DataTypes.JSON, allowNull: true },
      request_payload: { type: DataTypes.JSON, allowNull: true },
      response_payload: { type: DataTypes.JSON, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
    }, {
      sequelize,
      modelName: 'AiInteraction',
      tableName: 'ai_interactions',
      underscored: true,
      indexes: [
        { fields: ['chat_id', 'created_at'] },
        { fields: ['message_id'] },
        { fields: ['provider', 'created_at'] },
        { fields: ['should_fallback'] },
      ],
    });
    return AiInteraction;
  }
}
