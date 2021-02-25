import { Controller, Get, Post, Body, Headers, Delete, Logger, UseGuards, Param, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam, ApiBody, ApiOAuth2 } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './workspace.entity';
import { User } from '../users/users.entity';
import { CurrentUser } from '../common/decos';


// import {
//   SubscribeMessage,
//   WsResponse,
// } from '@nestjs/websockets';
// import { Observable, interval, timer } from 'rxjs';
// import { map, takeUntil } from 'rxjs/operators';

@ApiTags('workspaces')
@ApiOAuth2([])
@Controller('api/workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiParam({
    name: 'workspace',
    type: Workspace,
  })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [Workspace],
  })
  async findAll(@CurrentUser() user: User): Promise<Workspace[]> {
    return this.workspaceService.findAllByCurrentUser(user.userId);
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
  save(@CurrentUser() user: User, @Body() workspaces: Workspace[]): Promise<Workspace[]> {
    Logger.log(`receive Workspaces: ${JSON.stringify(workspaces)}`);
    Logger.log(`current User: ${JSON.stringify(user)}`);
    
    return this.workspaceService.save(workspaces.map(item => {
      return {
        ...item,
        userId: user.userId,
      };
    }));
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/:workspaceId')
  delete(@Param('workspaceId') workspaceId: number): Promise<any> {
    Logger.log(`receive Workspaces id: ${workspaceId}`);
    return this.workspaceService.deleteById( workspaceId );
  }

  @Post('nodes')
  @ApiResponse({
    status: 200,
    description: 'k8s nodes',
  })
  @ApiBody({
    type: Object,
  })
  getNodes(@Request() req): Promise<any> {
    return this.workspaceService.findNodes(req.body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/open-ws/:workspaceId')
  openWs(@Param('workspaceId') workspaceId: number): Promise<any> {
    return this.workspaceService.openWs( workspaceId );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/ws-is-alive/:workspaceId')
  isAlive(@Param('workspaceId') workspaceId: number): Promise<any> {
    return this.workspaceService.isAlive( workspaceId );
  }

}
