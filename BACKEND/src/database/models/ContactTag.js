import { DataTypes, Model } from 'sequelize';

export default class ContactTag extends Model {
  static initModel(sequelize) {
    ContactTag.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      contact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      color: DataTypes.STRING(20),
      created_by: DataTypes.BIGINT.UNSIGNED,
    }, {
      sequelize,
      modelName: 'ContactTag',
      tableName: 'contact_tags',
      underscored: true,
      indexes: [{ unique: true, fields: ['contact_id', 'name'] }],
    });
    return ContactTag;
  }
}
