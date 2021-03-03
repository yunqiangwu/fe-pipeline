import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs-extra';
import { join } from 'path';
import { Config } from '../config/config';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse() as Response;
      const request = ctx.getRequest() as Request;
      
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      if(!(exception instanceof HttpException)) {
        console.log(`Error: ${ (exception as HttpException ).message} \n ${ (exception as HttpException ).stack}`);
      }

      if(status === 404 && ( request.url.startsWith('/fed') || request.url === '/' )) {
        const filePath = join( Config.singleInstance().get('homeDir'), 'public/index.html');
        if(existsSync) {
          response.status(200).sendFile(filePath);
          return;
        }
      }

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: (exception as any)?.message,
      });
    }
  }