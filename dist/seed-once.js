"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const core_1 = require("@vendure/core");
const vendure_config_1 = require("./vendure-config");
const db_setup_1 = require("./db-setup");
const cli_1 = require("@vendure/core/cli");
const seedDb = async () => {
    // Rebuild native modules like bcrypt that may have issues on different platforms
    console.log('Rebuilding native modules...');
    try {
        (0, child_process_1.execSync)('npm rebuild bcrypt', { stdio: 'inherit' });
        console.log('Native modules rebuilt successfully');
    }
    catch (error) {
        console.warn('Failed to rebuild native modules, continuing anyway:', error.message);
    }
    const dbAlreadySeeded = await (0, db_setup_1.dbSeeded)(vendure_config_1.config.dbConnectionOptions);
    if (dbAlreadySeeded) {
        console.log('Database already seeded, skipping...');
        process.exit(0);
    }
    const updatedConfig = {
        ...vendure_config_1.config,
        dbConnectionOptions: {
            ...vendure_config_1.config.dbConnectionOptions,
            synchronize: !dbAlreadySeeded,
        },
    };
    try {
        console.log('Starting database population...');
        const initialDataPath = path_1.default.join(require.resolve('@vendure/create'), '../assets/initial-data.json');
        console.log('Initial data path:', initialDataPath);
        const initialData = require(initialDataPath);
        console.log('Initial data loaded, contains:', Object.keys(initialData));
        const app = await (0, cli_1.populate)(() => (0, core_1.bootstrap)(updatedConfig), initialData);
        console.log('Population completed successfully');
        await app.close();
        console.log('Database seeding completed');
    }
    catch (err) {
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
        await axios_1.default.post(`${url}/api/projectDeployed`, payload, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
};
seedDb();
reportDeploy();
