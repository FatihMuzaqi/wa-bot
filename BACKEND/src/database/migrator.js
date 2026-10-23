import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import databaseConfig from '../config/database.js';

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  databaseConfig,
);

const migrator = new Umzug({
  migrations: {
    glob: 'src/database/migrations/*.js',
    resolve: ({ name, path, context }) => ({
      name,
      up: async () => {
        const migration = await import(`file://${path}`);
        return migration.up(context, Sequelize);
      },
      down: async () => {
        const migration = await import(`file://${path}`);
        return migration.down(context, Sequelize);
      },
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
  logger: console,
});

const command = process.argv[2] || 'status';

try {
  if (command === 'up') await migrator.up();
  else if (command === 'down') await migrator.down();
  else if (command === 'status') {
    const [executed, pending] = await Promise.all([migrator.executed(), migrator.pending()]);
    console.table([
      ...executed.map((item) => ({ migration: item.name, status: 'executed' })),
      ...pending.map((item) => ({ migration: item.name, status: 'pending' })),
    ]);
  } else {
    throw new Error(`Unknown migration command: ${command}`);
  }
} finally {
  await sequelize.close();
}
