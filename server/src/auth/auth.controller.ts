import { Controller, Get, Post, Request, UseGuards, Headers, HttpException, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as querystring from 'querystring';
import { AuthService } from './auth.service';
import { ApiOAuth2, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { omit } from 'lodash';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';
import { AuthInfoDto } from './dto/auth-info.dto';
import { LoginAccountDto } from './dto/login-account.dto';
import { Config } from '../config/config';
import { CurrentUser } from '../common/decos';
import { AuthInfoWithAuthClientToken } from './dto/auth-info-with-auth-client-token';
import { ThreeAccount } from '../users/three-account.entity';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiResponse({
    status: 200,
    description: 'auth info',
    type: AuthInfoDto,
  })
  @ApiBody({
    description: 'login user info',
    type: LoginAccountDto,
  })
  async login(@CurrentUser() user: User) {
    // @Body() user: LoginAccountDto, 
    return user;
    // return this.authService.login(user);
  }

  @Post('login-with-auth-client-token')
  @ApiResponse({
    status: 200,
    description: 'auth info',
    type: AuthInfoWithAuthClientToken,
  })
  @ApiBody({
    description: 'login user info',
    type: LoginAccountDto,
  })
  async loginWithAuthClientToken(@Body() authInfoWithAuthClientToken: AuthInfoWithAuthClientToken) {
    return this.authService.loginWithAuthClientToken(authInfoWithAuthClientToken);
  }

  /**
   * 第三方登录
   */
  @Post('other-login')
  async otherLogin(@Request() req) {
    try{
      const args = {  ...req.body };
      delete args.bindUsername;
      return this.authService.otherAccountBind(args);
    }catch(e) {
      return e;
    }
  }

  /**
   * 第三方账号绑定
   */
  @Post('other-account-bind')
  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  async otherAccountBind(@Request() req, @CurrentUser() user: User) {
    try{
      const args = {  ...req.body };
      return this.authService.otherAccountBind(args, user);
    }catch(e) {
      return e;
    }
  }

    /**
   * 第三方账号绑定
   */
    @UseGuards(AuthGuard('jwt'))
    @ApiOAuth2([])
    @Get('other-account-bind')
    @ApiResponse({
      status: 200,
      description: 'ThreeAccount info list',
      type: [ThreeAccount],
    })
    async getOtherAccountBind(@CurrentUser() user: User) {
      try{
        return this.authService.getOtherAccountBind(user.userId);
      }catch(e) {
        return e;
      }
    }

  @UseGuards(AuthGuard('jwt'))
  @Get('self')
  @ApiOAuth2([])
  @ApiResponse({
    status: 200,
    description: 'user info',
    type: User,
  })
  async getSelfInfo(@CurrentUser() user: User): Promise<User> {
    console.log(user);
    const userInfo = await this.usersService.findOne(user.username);
    if(!userInfo) {
      throw new HttpException('用户信息不存在', HttpStatus.UNAUTHORIZED);
    }
    return (omit(userInfo, ['password']));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  async changePassword(@Request() req): Promise<User> {
    const jwtTokenUserInfo = this.jwtService.decode(req.headers['authorization'].split(' ')[1]);
    const userInfo = await this.usersService.findOne((jwtTokenUserInfo as any).username);
    if(!userInfo) {
      throw new HttpException('用户信息不存在', HttpStatus.BAD_REQUEST);
    }

    const { repassword, password } = req.body;

    if(!repassword || !password) {
      throw new HttpException('参数错误', HttpStatus.BAD_REQUEST);
    }

    if(repassword) {
      userInfo.password = repassword;
      await this.usersService.updateUser(userInfo);
    }

    return (omit(userInfo, ['password']));
  }

  @Get('oauth-config')
  async getOauthConfig(@Request() req): Promise<any> {
    let res = (Config.singleInstance().get('authProviders'));
    if(res && Array.isArray(res)) {

      res = res.map(item => {

       const type = item.type;

       let authUrl = '';

       switch(type) {
      //    case 'GitLab':
      // // authUrl: 'https://code.choerodon.com.cn/oauth/authorize?response_type=code&redirect_uri=${redirect_uri}&scope=read_user%20api&client_id=${client_id}'
      //      authUrl = `https://code.choerodon.com.cn/oauth/authorize?response_type=code&scope=read_user%20api&client_id=${item.clientId}`;
      //      break;

      //    case 'GitHub':
      // // authUrl: 'https://github.com/login/oauth/authorize?scope=user:email&client_id=${client_id}&redirect_uri=${redirect_uri}'
      //      authUrl = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${item.clientId}`;
      //      break;

         default:
      // authUrl: 'https://github.com/login/oauth/authorize?scope=user:email&client_id=${client_id}&redirect_uri=${redirect_uri}'
           authUrl = `${item.protocol}://${item.host}${item.oauth.callBackUrl}?client_id=${item.oauth.clientId}${item.oauth?.args ? `&${querystring.stringify(item.oauth.args)}` : ''}`;
           break;
       }


        return {
          ...item,
          oauth: {
            // ...item.oauth,
            authUrl,
            // clientSecret: null,
          }
        }
      })
    }
    return res;
  }
}
