import { Controller, Get, Post, Body, Headers, Delete, Logger, UseGuards, Param, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam, ApiBody, ApiOAuth2 } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './workspace.entity';
import { User } from '../users/users.entity';
import { CurrentUser } from '../common/decos';
import { CreateTempWorkspaceDto } from './dto/create-temp-workspace.dto';
import { CreateTempWorkspaceDtoResp } from './dto/create-temp-workspace-resp.dto';


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
        isZipUrl: item.gitUrl.includes('.zip'),
      };
    }));
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/:workspaceId')
  delete(@Param('workspaceId') workspaceId: number): Promise<any> {
    Logger.log(`receive Workspaces id: ${workspaceId}`);
    return this.workspaceService.deleteById( workspaceId );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/workspace-temp')
  @ApiBody({
    type: CreateTempWorkspaceDto,
  })
  @ApiResponse({
    status: 200,
    description: 'The saved record',
    type: CreateTempWorkspaceDtoResp,
  })
  async createTempWorkspace(@CurrentUser() user: User, @Body() _createTempWorkspaceDto: CreateTempWorkspaceDto): Promise<CreateTempWorkspaceDtoResp> {

    if(!_createTempWorkspaceDto.gitUrl) {
      throw new Error(`now gitUrl or zipUrl`);
    }
    const createTempWorkspaceDto = { ..._createTempWorkspaceDto };
    
    createTempWorkspaceDto.userId = user.userId;
    createTempWorkspaceDto.envJsonData = JSON.stringify(_createTempWorkspaceDto);

    const ws = await this.workspaceService.createTempWorkspace(createTempWorkspaceDto as Workspace);

    const createTempWorkspaceDtoResp = new CreateTempWorkspaceDtoResp();

    createTempWorkspaceDtoResp.ws = ws;

    return createTempWorkspaceDtoResp;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:workspaceId')
  @ApiResponse({
    status: 200,
    description: 'The record',
    type: Workspace,
  })
  get(@Param('workspaceId') workspaceId: number, @CurrentUser() user: User): Promise<Workspace> {
    Logger.log(`receive Workspaces id: ${workspaceId}`);
    return this.workspaceService.findById( workspaceId, user );
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
  @Post('/close-ws/:workspaceId')
  closeWs(@Param('workspaceId') workspaceId: number): Promise<any> {
    return this.workspaceService.closeWs( workspaceId );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/ws-is-alive/:workspaceId')
  isAlive(@Param('workspaceId') workspaceId: number): Promise<any> {
    return this.workspaceService.isAlive( workspaceId );
  }

}
