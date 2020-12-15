import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { ThreeAccount } from './three-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ThreeAccount])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
