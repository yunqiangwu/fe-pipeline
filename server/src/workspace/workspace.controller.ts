import { Controller, Get, Post, Body, Headers, Delete, Logger, UseGuards, Param, Request, Res, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam, ApiBody, ApiOAuth2 } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './workspace.entity';
import { User } from '../users/users.entity';
import { CurrentUser } from '../common/decos';
import { CreateTempWorkspaceDto } from './dto/create-temp-workspace.dto';
import { CreateTempWorkspaceDtoResp } from './dto/create-temp-workspace-resp.dto';
import { Response } from 'express';
import { Config } from 'src/config/config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';


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

    // createTempWorkspaceDto.envJsonData = JSON.stringify(_createTempWorkspaceDto);

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
  openWs(@Param('workspaceId') workspaceId: number, @CurrentUser() currentUser: User): Promise<any> {
    return this.workspaceService.openWs( workspaceId, currentUser );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/close-ws/:workspaceId')
  closeWs(@Param('workspaceId') workspaceId: number): Promise<any> {
    return this.workspaceService.closeWs( workspaceId );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/ws-is-alive/:workspaceId')
  async isAlive(@Param('workspaceId') workspaceId: number, @Res({ passthrough: true }) response: Response): Promise<any> {
    let res = {} as any;
    try{
      res = await this.workspaceService.isAlive( workspaceId );
      // response.cookie('key', hashKey, {
      //   path: '/',
      //   domain: res.wsHost,
      // });
      // response.status(302).redirect(`//${res.wsHost}`);
      // return;
      // console.log(`wsHost: ${res.wsHost}`);
    }catch(e) {
      console.error(e);
      throw e;
    }
    return {
      status: res.status,
      wsHost: res.wsHost,
    };
  }

  // @UseGuards(AuthGuard('jwt'))
  // @UseGuards(AuthGuard('local'))
  @UseGuards(JwtAuthGuard)
  @Get('/redirect-ws-url/:workspaceId')
  async redirectToWsUrl(@Param('workspaceId') workspaceId: number, @Headers('host') _host: string, @Req() req: Request, @Res({ passthrough: true }) response: Response): Promise<any> {
    let res = {} as any;
    try{
      res = await this.workspaceService.getRedirectToWsInfo( workspaceId );
      const host = (_host || '').replace(/:\d+$/, '');
      // console.log(host, req.url);
      const configHost = Config.singleInstance().get('hostname').replace(/:\d+$/, '');
      if(host === configHost) {
         response.status(302).redirect(`//${res.wsHost}${req.url || '/'}`);
         return;
      } else if(host.endsWith(`ws.${configHost}`) ) {
        response.cookie('key', res.password, {
          path: '/',
          domain: res.wsHost,
          sameSite: 'none',
          secure: true,
        });
        response.status(302).redirect(`/`);
        return;
      }
      return {};
      // console.log(`wsHost: ${res.wsHost}`);
    }catch(e) {
      console.error(e);
      throw e;
    }
  }
  
}
