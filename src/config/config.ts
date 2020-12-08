import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ConnectionOptions } from 'typeorm';
import { Logger } from '@nestjs/common';

interface IConfig {
    homeDir: string;
    db: ConnectionOptions;
}

export function getAppHomeDir() {
    const appHomeDir = path.resolve(process.cwd(), 'fe-pipeline-home');
    if (fs.existsSync(appHomeDir)) {
        fs.mkdirpSync(appHomeDir);
    }
    return appHomeDir;
}

function getDefaultConfig(): IConfig {
    const appHomeDir = getAppHomeDir();
    const defaultConfig: IConfig = {
        homeDir: appHomeDir,
        db: {
            type: 'sqlite',
            database: path.resolve(appHomeDir, 'db'),
            key: 'fe-pipeline',
        },
    };
    return defaultConfig;
}

function getConfig(): IConfig {
    const defaultConfig = getDefaultConfig();

    let fileConfig;
    let filePath = path.resolve(defaultConfig.homeDir, 'config/config.yml');
    if(!fs.existsSync(filePath)) {
        filePath = path.resolve(process.cwd(), 'config/config.yml');
    }
    if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath).toString();
        try {
            fileConfig = yaml.parse(file);
        } catch (e) {
            Logger.error(e.message);
        }
    }

    return {
        ...defaultConfig,
        ...fileConfig,
    };
}

const config = getConfig();

export { getConfig, config };
