import { Controller, Request, Post, Get, UseGuards, Headers } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOAuth2 } from '@nestjs/swagger';
import { omit } from 'lodash';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from '../app/app.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
    // console.log(req);
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('config')
  @ApiOAuth2([])
  @ApiResponse({
    status: 200,
    description: 'Config',
    type: Object,
  })
  getConfig(): any {
    return omit(this.appService.getConfig(), ['auth']);
  }
}
