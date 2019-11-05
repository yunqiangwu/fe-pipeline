import { Injectable } from '@nestjs/common';
import { config } from '@/config/config';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getConfig(): any {
    return config;
  }
}
