// import { NpiInterceptor } from './npi.interceptor';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { ProxyHandler } from './proxy/proxy.handler';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/any-exception.filter'

export async function startServer(port = 3000) {
  const app = await NestFactory.create(AppModule, {cors: true});

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalFilters(  new AllExceptionsFilter()  );
  app.use(ProxyHandler());

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
          authorizationUrl: process.env.NODE_ENV==='development' ? 'http://localhost:8000/login' : 'http://fe-pipeline.open-front.hand-china.com/login',
          // tokenUrl: 'http://localhost:8000/login',
          // refreshUrl: 'http://localhost:8000/login',
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
      oauth2RedirectUrl: `${SWAGGER_UI_BASE_PATH}/oauth2-redirect.html`,
      oauth: {
        clientId: process.env.NODE_ENV === 'development' ? "localhost" : 'prod',
      },
    }
  });

  await app.listen(port, '0.0.0.0');
}
