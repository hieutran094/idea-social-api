export const TypeOrmConfig: any = {
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  keepConnectionAlive: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrationsRun: true,
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/../**/*.migration{.ts,.js}'],
  timezone: 'UTC',
  logging: true,
};