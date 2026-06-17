"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbSeeded = void 0;
const typeorm_1 = require("typeorm");
const dbSeeded = async (dbConfig) => {
    console.log('Checking if database has been seeded...');
    try {
        const dataSource = new typeorm_1.DataSource(dbConfig);
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
    }
    catch (error) {
        console.error('Error checking if database has been seeded:', error);
        return false;
    }
};
exports.dbSeeded = dbSeeded;
