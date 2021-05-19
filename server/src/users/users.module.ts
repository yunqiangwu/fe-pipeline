import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { PrismaService } from '../app/prisma.service';
// import { User } from './users.entity';
// import { ThreeAccount } from './three-account.entity';

@Module({
  // imports: [TypeOrmModule.forFeature([User, ThreeAccount])],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
