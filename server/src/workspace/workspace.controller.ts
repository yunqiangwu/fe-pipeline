import { Controller, Get, Post, Body, Delete, Logger, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam, ApiBody, ApiOAuth2 } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './workspace.entity';

@ApiTags('workspaces')
@ApiOAuth2([])
@Controller('api/workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiParam({
    name: 'workspace',
    type: Workspace,
  })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: Workspace,
  })
  findAll(): Promise<Workspace[]> {
    return this.workspaceService.findAllByCurrentUser();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Create workspaces' })
  @ApiBody({
    type: [Workspace],
  })
  @ApiResponse({
    status: 200,
    description: 'The saved record',
    type: [Workspace],
  })
  @ApiResponse({ status: 401, description: 'Forbidden.' })
  save( @Body() workspaces: Workspace[]): Promise<Workspace[]> {
    Logger.log(`receive Workspaces: ${workspaces}`);
    
    return this.workspaceService.save(workspaces);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete()
  delete(@Param('workspaceId') workspaceId: number): Promise<any> {
    Logger.log(`receive Workspaces id: ${workspaceId}`);
    return this.workspaceService.deleteById( workspaceId );
  }
}
