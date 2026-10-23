const now = () => new Date();

const permissionsByRole = {
  admin: [
    ['users', 'manage', 'all'],
    ['settings', 'manage', 'all'],
    ['chats', 'manage', 'all'],
    ['bot_rules', 'manage', 'all'],
    ['forms', 'manage', 'all'],
    ['broadcasts', 'manage', 'all'],
    ['scheduler', 'manage', 'all'],
    ['ai_chatbot', 'manage', 'all'],
    ['automation', 'manage', 'all'],
    ['documents', 'manage', 'all'],
    ['analytics', 'read', 'all'],
  ],
  agent: [
    ['chats', 'read', 'assigned'],
    ['chats', 'reply', 'assigned'],
    ['chats', 'take_over', 'team'],
    ['contacts', 'read', 'assigned'],
    ['ai_chatbot', 'generate', 'assigned'],
    ['notifications', 'read', 'own'],
  ],
};

export async function up(queryInterface, Sequelize) {
  const roles = await queryInterface.sequelize.query(
    'SELECT id, name FROM roles WHERE name IN (:names)',
    {
      replacements: { names: Object.keys(permissionsByRole) },
      type: Sequelize.QueryTypes.SELECT,
    },
  );

  const roleIdByName = Object.fromEntries(roles.map((role) => [role.name, role.id]));
  const rows = Object.entries(permissionsByRole).flatMap(([roleName, permissions]) => (
    permissions.map(([resource, action, scope]) => ({
      role_id: roleIdByName[roleName],
      resource,
      action,
      scope,
      created_at: now(),
      updated_at: now(),
    }))
  )).filter((row) => row.role_id);

  await queryInterface.bulkInsert('permissions', rows, {
    ignoreDuplicates: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('permissions', {
    resource: [
      'users',
      'settings',
      'chats',
      'bot_rules',
      'forms',
      'broadcasts',
      'scheduler',
      'ai_chatbot',
      'automation',
      'documents',
      'analytics',
      'contacts',
      'notifications',
    ],
  });
}
