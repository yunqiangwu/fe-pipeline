import { Controller, Request, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { omit } from 'lodash';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from '@/app/app.service';

@ApiTags('fe-pipeline')
@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('config')
  getConfig(): any {
    return omit(this.appService.getConfig(), ['auth']);
  }
}
