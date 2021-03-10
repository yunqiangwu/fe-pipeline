import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './workspace.entity';
import { UsersModule } from 'src/users/users.module';
import { ContextParser } from './utils/context-parser';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace]), UsersModule],
  providers: [WorkspaceService, ContextParser],
  controllers: [WorkspaceController],
})
export class WorkspaceModule {}
