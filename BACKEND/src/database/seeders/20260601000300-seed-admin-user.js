import bcrypt from 'bcryptjs';

const now = () => new Date();

export async function up(queryInterface, Sequelize) {
  const [adminRole] = await queryInterface.sequelize.query(
    'SELECT id FROM roles WHERE name = :name LIMIT 1',
    {
      replacements: { name: 'admin' },
      type: Sequelize.QueryTypes.SELECT,
    },
  );

  if (!adminRole) {
    throw new Error('Admin role is required before seeding admin user');
  }

  const passwordHash = await bcrypt.hash('Admin123!', Number(process.env.BCRYPT_SALT_ROUNDS || 12));

  await queryInterface.bulkInsert('users', [
    {
      role_id: adminRole.id,
      name: 'Default Admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      phone: null,
      avatar_url: null,
      status: 'active',
      last_login_at: null,
      metadata: JSON.stringify({
        seeded: true,
        seeded_at: now().toISOString(),
      }),
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
    },
  ], {
    ignoreDuplicates: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('users', {
    email: 'admin@example.com',
  });
}
