// import { NpiInterceptor } from './npi.interceptor';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import axios from 'axios';
import { join, dirname } from 'path';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/any-exception.filter';
import { Config } from './config/config';
import { existsSync, mkdirp } from 'fs-extra';
import { CorsOptionsCallback } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Request } from 'express';
// import { Request } from '@nestjs/common';



export async function startServer(port = 3000) {

  // axios.defaults.proxy={
  //   host: '127.0.0.1',
  //   port: 8001,
  //   protocol: 'http',
  // };

  // @ts-ignore
  if(!axios._is_config) {
    axios.defaults.timeout = 40000;

    axios.interceptors.response.use(res => res, error => {
      console.log({
        config: error.response?.config,
        retData: error.response?.data
      })
      return Promise.reject(error);
    });
    // @ts-ignore
    axios._is_config = true;
  }

  const dbType = Config.singleInstance().get('db.type');

  if(dbType === 'sqlite') {
    const dbFileDir = dirname(Config.singleInstance().get('db.database'));
    if(!existsSync(dbFileDir)) {
      mkdirp(dbFileDir);
    }
  }

  const app = await NestFactory.create(AppModule, {cors: (req: Request, cb: CorsOptionsCallback) => {

    // const origin = req.hostname;

    // console.log('host:', req.headers );

    cb(null, {
      // origin: req.headers['origin'] || req.headers['host'] || req.hostname,
      // origin: 'fe-pipeline.localhost:8000, fe-pipeline.localhost:3000, 23000-10-1-0-98.ws.fe-pipeline.localhost',
      // origin: origin,
    });
  }});

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalFilters(  new AllExceptionsFilter()  );

  const SWAGGER_UI_BASE_PATH = '/swagger-ui';

  const options = new DocumentBuilder()
    .setTitle('Fe Pipeline')
    .setDescription('The Fe Pipeline API description')
    .setVersion('1.0')
    .addTag('fe-pipeline')
    .addSecurity('oauth2', {
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: `http://${Config.singleInstance().get('hostname')}${Config.singleInstance().get('fe-path')||'/'}login` ,
          scopes: {
            email: true,
          },
        }
      }
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup(SWAGGER_UI_BASE_PATH, app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `http://${Config.singleInstance().get('hostname').replace(':8000', '')}:${Config.singleInstance().get('ingress-backend-port') || 80}${SWAGGER_UI_BASE_PATH}/oauth2-redirect.html`,
      oauth: {
        clientId: process.env.NODE_ENV === 'development' ? "localhost" : 'prod',
      },
    }
  });

  (app as any).useStaticAssets(join(Config.singleInstance().get('homeDir'), 'public'),  {
    prefix: Config.singleInstance().get('fe-path') || '/fed/',
  });

  await app.listen(port, '0.0.0.0');
}
