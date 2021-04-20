import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import * as querystring from 'querystring';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    canActivate(context: ExecutionContext) {
        // console.log(`JwtAuthGuard canActivate`);

        const req = context.switchToHttp().getRequest() as Request;

        if(!req.headers['authorization'] && req.url.includes('access_token=')) {
            req.headers['authorization'] = `Bearer ${querystring.parse(req.url.substr(req.url.indexOf('?') + 1)).access_token}`;
        }

        if(!req.headers['authorization'] && req.headers.cookie && req.headers.cookie.includes('access_token=')) {
          const access_token = req.headers.cookie.replace(
            /^.*access_token=([^;]+);?.*$/,
            '$1',
          );
          req.headers['authorization'] = `Bearer ${access_token}`;
        }

        // 在这里添加自定义的认证逻辑
        // 例如调用 super.logIn(request) 来建立一个session
        return super.canActivate(context);
      }
    
      handleRequest(err, user, info) {
        //   console.log(`JwtAuthGuard handleRequest`);
        //   console.log(info)
        // 可以抛出一个基于info或者err参数的异常
        if (err || !user) {
          throw err || new UnauthorizedException();
        }
        return user;
      }
}
