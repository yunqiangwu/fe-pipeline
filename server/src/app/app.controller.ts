import { Controller, Request, Post, Get, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { omit } from 'lodash';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from '@/app/app.service';

@ApiTags('fe-pipeline')
@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  @ApiResponse({
    status: 200,
    description: 'Hello String',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('config')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Config',
    type: Object,
  })
  getConfig(): any {
    return omit(this.appService.getConfig(), ['auth']);
  }
}
