import { DataTypes, Model } from 'sequelize';

export default class AutomationWorkflow extends Model {
  static initModel(sequelize) {
    AutomationWorkflow.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      provider: { type: DataTypes.ENUM('n8n', 'internal', 'webhook'), allowNull: false, defaultValue: 'n8n' },
      external_workflow_id: DataTypes.STRING(191),
      trigger_event: { type: DataTypes.STRING(100), allowNull: false },
      webhook_url: DataTypes.STRING(500),
      secret_hash: DataTypes.STRING(255),
      status: { type: DataTypes.ENUM('active', 'paused', 'disabled'), allowNull: false, defaultValue: 'active' },
      success_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      failure_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      last_run_at: DataTypes.DATE,
      config: DataTypes.JSON,
      created_by: DataTypes.BIGINT.UNSIGNED,
      deleted_at: DataTypes.DATE,
    }, { sequelize, modelName: 'AutomationWorkflow', tableName: 'automation_workflows', underscored: true, paranoid: true, deletedAt: 'deleted_at' });
    return AutomationWorkflow;
  }
}
