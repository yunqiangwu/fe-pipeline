import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AppService {

  private helloMessage: string;

  constructor(private configService: ConfigService) {
    this.helloMessage = configService.get('HELLO_MESSAGE');
  }

  getHello(): string {
    return this.helloMessage;
  }

  getConfig(): any {
    return this.configService.configObj.config;
  }
}
