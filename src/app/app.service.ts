import { Injectable } from '@nestjs/common';
import { config } from '@/config/config';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class AppService {

  private helloMessage: string;

  constructor(configService: ConfigService) {
    this.helloMessage = configService.get('HELLO_MESSAGE');
  }

  getHello(): string {
    return this.helloMessage;
  }

  getConfig(): any {
    return config;
  }
}
