import { DataSource, DataSourceOptions } from 'typeorm';


export const dbSeeded = async (dbConfig: DataSourceOptions): Promise<boolean> => {
  console.log('Checking if database has been seeded...');
  try {
    const dataSource = new DataSource(dbConfig);

    await dataSource.initialize();

    const queryRunner = dataSource.createQueryRunner();

    // Check if the database has been seeded by checking if any tables exist
    const tables = await queryRunner.manager.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
      LIMIT 1
    `, ['public']);

    await queryRunner.release();
    await dataSource.destroy();

    const isSeeded = tables.length > 0;
    console.log('Database seeded:', isSeeded, tables.length > 0 ? '(tables exist)' : '(no tables found)');

    return isSeeded;
  } catch (error) {
    console.error('Error checking if database has been seeded:', error);
    return false;
  }
};

export interface DbConnectionOptions {
  type: "oracle" | "postgres";
  synchronize: boolean;
  migrations: string[] | string;
  logging: boolean;
  database: string | undefined;
  schema: string | undefined;
  host: string | undefined;
  port: number | undefined;
  username: string | undefined;
  password: string | undefined;
}
