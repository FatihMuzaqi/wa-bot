import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import databaseConfig from '../config/database.js';

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  databaseConfig,
);

const seeder = new Umzug({
  migrations: {
    glob: 'src/database/seeders/*.js',
    resolve: ({ name, path, context }) => ({
      name,
      up: async () => {
        const seed = await import(`file://${path}`);
        return seed.up(context, Sequelize);
      },
      down: async () => {
        const seed = await import(`file://${path}`);
        return seed.down(context, Sequelize);
      },
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_seed_meta' }),
  logger: console,
});

const command = process.argv[2] || 'status';

try {
  if (command === 'up') await seeder.up();
  else if (command === 'down') await seeder.down();
  else if (command === 'status') {
    const [executed, pending] = await Promise.all([seeder.executed(), seeder.pending()]);
    console.table([
      ...executed.map((item) => ({ seeder: item.name, status: 'executed' })),
      ...pending.map((item) => ({ seeder: item.name, status: 'pending' })),
    ]);
  } else {
    throw new Error(`Unknown seeder command: ${command}`);
  }
} finally {
  await sequelize.close();
}
