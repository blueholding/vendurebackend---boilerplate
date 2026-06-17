import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';
import { dbSeeded } from './db-setup';
import { populate } from '@vendure/core/cli';

const seedDb =async () => {
  // Rebuild native modules like bcrypt that may have issues on different platforms
  console.log('Rebuilding native modules...');
  try {
    execSync('npm rebuild bcrypt', { stdio: 'inherit' });
    console.log('Native modules rebuilt successfully');
  } catch (error) {
    console.warn('Failed to rebuild native modules, continuing anyway:', (error as Error).message);
  }
  const dbAlreadySeeded = await dbSeeded(config.dbConnectionOptions);
  if (dbAlreadySeeded) {
    console.log('Database already seeded, skipping...');
    process.exit(0);
  }
  const updatedConfig = {
    ...config,
    dbConnectionOptions: {
      ...config.dbConnectionOptions,
      synchronize: !dbAlreadySeeded,
    },
  };

  try {
    console.log('Starting database population...');
    const initialDataPath = path.join(require.resolve('@vendure/create'), '../assets/initial-data.json');
    console.log('Initial data path:', initialDataPath);

    const initialData = require(initialDataPath);
    console.log('Initial data loaded, contains:', Object.keys(initialData));

    const app = await populate(() => bootstrap(updatedConfig), initialData);
    console.log('Population completed successfully');
    await app.close();
    console.log('Database seeding completed');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

const reportDeploy = async () => {
  const url = process.env.TEMPLATE_REPORTER_URL;
  if (!url) {
    return;
  }
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const templateId = 'vendure';
  const payload = { projectId, templateId };
  try {
      await axios.post(`${url}/api/projectDeployed`, payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
  } catch (error) {
      console.error(`An error occurred: ${(error as any).message}`);
  }
};

seedDb();
reportDeploy();
