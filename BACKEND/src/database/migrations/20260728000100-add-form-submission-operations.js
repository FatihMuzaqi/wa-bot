export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('form_submissions', 'operational_status', {
    type: Sequelize.ENUM('new', 'in_review', 'resolved'),
    allowNull: false,
    defaultValue: 'new',
    after: 'status',
  });
  await queryInterface.addColumn('form_submissions', 'notes', {
    type: Sequelize.TEXT,
    allowNull: true,
    after: 'operational_status',
  });
  await queryInterface.addColumn('form_submissions', 'forwarded_at', {
    type: Sequelize.DATE,
    allowNull: true,
    after: 'completed_at',
  });
  await queryInterface.addColumn('form_submissions', 'forward_status', {
    type: Sequelize.ENUM('pending', 'sent', 'failed'),
    allowNull: true,
    after: 'forwarded_at',
  });
  await queryInterface.addColumn('form_submissions', 'forward_error', {
    type: Sequelize.TEXT,
    allowNull: true,
    after: 'forward_status',
  });
  await queryInterface.addIndex('form_submissions', ['operational_status', 'created_at'], {
    name: 'idx_form_submissions_operational_created',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('form_submissions', 'idx_form_submissions_operational_created');
  await queryInterface.removeColumn('form_submissions', 'forward_error');
  await queryInterface.removeColumn('form_submissions', 'forward_status');
  await queryInterface.removeColumn('form_submissions', 'forwarded_at');
  await queryInterface.removeColumn('form_submissions', 'notes');
  await queryInterface.removeColumn('form_submissions', 'operational_status');
}
