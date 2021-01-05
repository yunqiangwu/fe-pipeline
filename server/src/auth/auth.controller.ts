import { Controller, Get, Post, Request, UseGuards, Headers, HttpException, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiOAuth2, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { omit } from 'lodash';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';
import { AuthInfoDto } from './dto/auth-info.dto';
import { LoginAccountDto } from './dto/login-account.dto';
import { Config } from '@/config/config';
import { CurrentUser } from '@/common/decos';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // @UseGuards(AuthGuard('local'))
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
  async login(@Body() user: LoginAccountDto) {
    return this.authService.login(user);
  }

  /**
   * 第三方登录
   */
  @Post('other-login')
  async otherLogin(@Request() req) {
    const {
      // redirect_uri,
      loginType,
      access_token,
     } = req.body;
     if(!loginType && !access_token) {
        throw new Error('参数 loginType 或 access_token 不存在!');
     }
    try{
      return this.authService.otherAccountBind({
        loginType,
        access_token,
      });
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
    return (omit(Config.singleInstance().get('auth.oauthConfig'), ['github.client_secret']));
  }
}
