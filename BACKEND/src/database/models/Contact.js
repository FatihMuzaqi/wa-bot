import { DataTypes, Model } from 'sequelize';

export default class Contact extends Model {
  static initModel(sequelize) {
    Contact.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      whatsapp_id: { type: DataTypes.STRING(191), unique: true },
      phone: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      name: DataTypes.STRING(150),
      email: DataTypes.STRING(191),
      company: DataTypes.STRING(150),
      profile_picture_url: DataTypes.STRING(500),
      source: { type: DataTypes.ENUM('whatsapp', 'form', 'import', 'api', 'manual'), allowNull: false, defaultValue: 'whatsapp' },
      status: { type: DataTypes.ENUM('active', 'blocked', 'archived'), allowNull: false, defaultValue: 'active' },
      metadata: DataTypes.JSON,
      deleted_at: DataTypes.DATE,
    }, {
      sequelize,
      modelName: 'Contact',
      tableName: 'contacts',
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [{ fields: ['phone'] }, { fields: ['status'] }],
    });
    return Contact;
  }
}
