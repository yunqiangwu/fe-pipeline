import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import { get, assign } from 'lodash';
import * as path from 'path';
import { ConnectionOptions } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ConfigOptions } from './interfaces';

export interface IConfig {
    homeDir: string;
    db: ConnectionOptions;
}

export function getAppHomeDir() {
    const appHomeDir = process.env.FE_PIPELINE_HOME || path.resolve(process.cwd(), 'fe-pipeline-home');
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


export class Config{

    static CONST_KEY = '_FE_PIPELINE_CONFIG_KEY';

    static getConfig(): IConfig {
        const defaultConfig = getDefaultConfig();
    
        let fileConfig;
        let filePath = path.resolve(defaultConfig.homeDir, 'config/config.yml');
        if(!fs.existsSync(filePath)) {
            filePath = path.resolve(path.resolve(__dirname, '../../server', 'config/config.yml'));
        }
        if (fs.existsSync(filePath)) {
            const file = fs.readFileSync(filePath).toString();
            try {
                fileConfig = yaml.parse(file);
            } catch (e) {
                Logger.error(e.message);
            }
        }

        if(process.env.NODE_ENV) {
            filePath = path.resolve(defaultConfig.homeDir, `config/config.${process.env.NODE_ENV}.yml`);
            if(!fs.existsSync(filePath)) {
                filePath = path.resolve(path.resolve(__dirname, '../../server', `config/config.${process.env.NODE_ENV}.yml`));
            }
            if(fs.existsSync(filePath)) {
                const file = fs.readFileSync(filePath).toString();
                try {
                    fileConfig = assign(fileConfig, yaml.parse(file));
                } catch (e) {
                    Logger.error(e.message);
                }
            }
        }

        return {
            ...defaultConfig,
            ...fileConfig,
        };
    }

    static singleInstance(options?: ConfigOptions): Config {
        if(!global[Config.CONST_KEY]) {
            global[Config.CONST_KEY] = new Config(options);
        }
        return  global[Config.CONST_KEY];
    }

    config: IConfig;

    constructor(options?: ConfigOptions){
        this.config = Config.getConfig();
    };

    /**
     * get value
     */
    public get(key) {
        return get(this.config, key);
    }
}

