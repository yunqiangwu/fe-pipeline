import { Injectable, Inject } from '@nestjs/common';

// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// import * as path from 'path';

import { EnvConfig, ConfigOptions } from '../config/interfaces';
import { CONFIG_OPTIONS } from '../config/constants';
import { Config } from './config';

@Injectable()
export class ConfigService {
  // private readonly envConfig: EnvConfig;
  configObj: Config;

  constructor(@Inject(CONFIG_OPTIONS) private options: ConfigOptions) {
    // const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    // let envFile = path.resolve(getAppHomeDir(), options.folder, filePath);
    // if(!fs.existsSync(envFile)) {
    //   envFile = path.resolve(__dirname, '../../server', options.folder, filePath);
    // }
    // this.envConfig = dotenv.parse(fs.readFileSync(envFile));
    this.configObj = Config.singleInstance({
      // env: process.env.NODE_ENV,
      folder: options.folder,
    });
  }

  get(key: string): string | any {
    // return this.envConfig[key];
    return this.configObj.get(key);
  }

}
