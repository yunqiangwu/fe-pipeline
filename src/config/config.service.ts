import { Injectable, Inject } from '@nestjs/common';

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { EnvConfig, ConfigOptions } from '@/config/interfaces';
import { CONFIG_OPTIONS } from '@/config/constants';
import { getAppHomeDir } from './config';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject(CONFIG_OPTIONS) private options: ConfigOptions) {
    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    let envFile = path.resolve(getAppHomeDir(), options.folder, filePath);
    if(!fs.existsSync(envFile)) {
      envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    }
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
