const now = () => new Date();

const permissions = {
  admin: [
    ['users', 'manage', 'all'],
    ['settings', 'manage', 'all'],
    ['chats', 'manage', 'all'],
    ['bot_rules', 'manage', 'all'],
    ['broadcasts', 'manage', 'all'],
    ['ai', 'manage', 'all'],
    ['automation', 'manage', 'all'],
    ['documents', 'manage', 'all'],
    ['analytics', 'read', 'all'],
  ],
  agent: [
    ['chats', 'read', 'assigned'],
    ['chats', 'reply', 'assigned'],
    ['chats', 'take_over', 'team'],
    ['contacts', 'read', 'assigned'],
    ['notifications', 'read', 'own'],
  ],
};

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert('roles', [
    {
      name: 'admin',
      description: 'Full platform administrator',
      is_system: true,
      created_at: now(),
      updated_at: now(),
    },
    {
      name: 'agent',
      description: 'Customer support agent',
      is_system: true,
      created_at: now(),
      updated_at: now(),
    },
  ], { ignoreDuplicates: true });

  const roles = await queryInterface.sequelize.query(
    'SELECT id, name FROM roles WHERE name IN (:names)',
    {
      replacements: { names: ['admin', 'agent'] },
      type: Sequelize.QueryTypes.SELECT,
    },
  );

  const roleIdByName = Object.fromEntries(roles.map((role) => [role.name, role.id]));
  const rows = Object.entries(permissions).flatMap(([roleName, rolePermissions]) => (
    rolePermissions.map(([resource, action, scope]) => ({
      role_id: roleIdByName[roleName],
      resource,
      action,
      scope,
      created_at: now(),
      updated_at: now(),
    }))
  )).filter((row) => row.role_id);

  await queryInterface.bulkInsert('permissions', rows, { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('permissions', {
    resource: ['users', 'settings', 'chats', 'bot_rules', 'broadcasts', 'ai', 'automation', 'documents', 'analytics', 'contacts', 'notifications'],
  });
  await queryInterface.bulkDelete('roles', { name: ['admin', 'agent'] });
}
