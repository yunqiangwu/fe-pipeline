import { Controller, Request, Post, Get, UseGuards, Headers, Param, Body, Query, Delete, Put } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOAuth2 } from '@nestjs/swagger';
import { omit } from 'lodash';
import { InjectS3, S3 } from 'nestjs-s3';
import { AppService } from '../app/app.service';
import { ThreeAccount, Prisma } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../app/prisma.service';

@ApiTags('users')
@Controller('/api')
export class UsersController {
  constructor(
    private readonly prismaService: PrismaService,
  ) { }

  @Get()
  async getAllUsers(): Promise<ThreeAccount[]> {
    return this.prismaService.threeAccount.findMany({ take: 3 })
  }
}
