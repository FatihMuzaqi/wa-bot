const now = () => new Date();

export async function up(queryInterface) {
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
  ], {
    ignoreDuplicates: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('roles', {
    name: ['admin', 'agent'],
  });
}
