import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import { get, assign, mapValues } from 'lodash';
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
            database: path.resolve(appHomeDir, 'data/sqlite.db'),
            key: 'fe-pipeline',
        },
    };
    return defaultConfig;
}


export class Config {

    static CONST_KEY = '_FE_PIPELINE_CONFIG_KEY';

    static getConfig(): IConfig {
        const defaultConfig = getDefaultConfig();

        let fileConfig;
        let filePath = path.resolve(defaultConfig.homeDir, 'config/config.yml');

        if (!fs.existsSync(filePath)) {
            filePath = path.resolve(path.resolve(process.cwd(), `server/config/config.yml`));
        }

        if (fs.existsSync(filePath)) {
            const file = fs.readFileSync(filePath).toString();
            try {
                fileConfig = yaml.parse(file);
            } catch (e) {
                Logger.error(e.message);
            }
        }

        if (process.env.NODE_ENV) {
            filePath = path.resolve(defaultConfig.homeDir, `config/config.${process.env.NODE_ENV}.yml`);

            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(path.resolve(process.cwd(), `server/config/config.${process.env.NODE_ENV}.yml`));
            }

            if (fs.existsSync(filePath)) {
                const file = fs.readFileSync(filePath).toString();
                try {
                    fileConfig = assign(fileConfig, yaml.parse(file));

                    const configObj = fileConfig;

                    const templateVarReg = /(?<!\\)\$\{([A-Za-z_\-0-9]+):?-?(.+)?\}/g;

                    /**
                     * 处理 ${xxx:defaultVal} 模块变量
                     * @param {string} val
                     */
                    const handleEnvStr = (val, result) => {
                        if (templateVarReg.test(val)) {
                            return val.replace(templateVarReg, (_, envName, defaultValue) => {
                                return process.env[envName] || result[envName] || defaultValue;
                            });
                        }
                        return val;
                    };
                    const handleEnvValue = (val, result) => {
                        let resultVal = val;
                        if (typeof val === 'string') {
                            return handleEnvStr(val, result);
                        } else if (typeof val === 'object') {
                            if (Array.isArray(val)) {
                                resultVal = val.map((item) => handleEnvValue(item, result));
                            } else {
                                resultVal = mapValues(val, (childrenVal) => {
                                    if (typeof childrenVal === 'string') {
                                        return handleEnvStr(childrenVal, result);
                                    } else if (typeof childrenVal === 'object') {
                                        return handleEnvValue(childrenVal, result);
                                    }
                                    return childrenVal;
                                });
                            }
                        }
                        return resultVal;
                    };

                    const envObj = Object.keys(configObj).reduce((result, configKey) => {
                        const value = handleEnvValue(configObj[configKey], result);
                        result[configKey] = value;
                        return result;
                    }, {});

                    fileConfig = envObj;

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
        if (!global[Config.CONST_KEY]) {
            global[Config.CONST_KEY] = new Config(options);
        }
        return global[Config.CONST_KEY];
    }

    config: IConfig;

    constructor(options?: ConfigOptions) {
        this.config = Config.getConfig();
    };

    /**
     * get value
     */
    public get(key) {
        return get(this.config, key);
    }
}

