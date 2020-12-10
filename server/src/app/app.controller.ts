import { Controller, Request, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { AppService } from '@/app/app.service';

@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @UseGuards(AuthGuard('local'))
  // @Post('auth/login')
  // async login(@Request() req) {
  //   return req.user;
  // }

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('config')
  getConfig(): string {
    return this.appService.getConfig();
  }
}
