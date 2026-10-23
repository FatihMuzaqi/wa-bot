import { DataTypes, Model } from "sequelize";

export default class EvolutionWebhookEvent extends Model {
  static initModel(sequelize) {
    EvolutionWebhookEvent.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        event_key: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true,
        },
        event_type: {
          type: DataTypes.ENUM(
            "messages.upsert",
            "messages.update",
            "contacts.update",
            "chats.update",
            "chats.upsert",
            "connection.update",
            "qr.updated",
            "unknown",
          ),
        },
        instance_name: DataTypes.STRING(191),
        external_message_id: DataTypes.STRING(191),
        connection_state: DataTypes.STRING(80),
        payload: { type: DataTypes.JSON, allowNull: false },
        duplicate_count: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        received_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        processed_at: DataTypes.DATE,
        failed_at: DataTypes.DATE,
        error_message: DataTypes.TEXT,
      },
      {
        sequelize,
        modelName: "EvolutionWebhookEvent",
        tableName: "evolution_webhook_events",
        underscored: true,
        indexes: [
          { unique: true, fields: ["event_key"] },
          { fields: ["event_type", "received_at"] },
          { fields: ["instance_name", "received_at"] },
          { fields: ["external_message_id"] },
        ],
      },
    );
    return EvolutionWebhookEvent;
  }
}
