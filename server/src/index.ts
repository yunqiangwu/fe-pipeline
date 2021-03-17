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


export async function startServer(port = 3000) {

  // axios.defaults.proxy={
  //   host: '127.0.0.1',
  //   port: 8001,
  //   protocol: 'http',
  // };

  axios.defaults.timeout = 40000;

  const dbType = Config.singleInstance().get('db.type');

  if(dbType === 'sqlite') {
    const dbFileDir = dirname(Config.singleInstance().get('db.database'));
    if(!existsSync(dbFileDir)) {
      mkdirp(dbFileDir);
    }
  }

  const app = await NestFactory.create(AppModule, {cors: true});

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
