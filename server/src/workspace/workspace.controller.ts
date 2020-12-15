import { Controller, Get, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './workspace.entity';

@ApiTags('photo')
@Controller('api/workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(): Promise<Workspace[]> {
    return this.workspaceService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  save(@Body() workspaces: Workspace[]): Promise<Workspace[]> {
    Logger.log(`receive Workspaces: ${workspaces}`);
    return this.workspaceService.save(workspaces);
  }
}
