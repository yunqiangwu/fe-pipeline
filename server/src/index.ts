// import { NpiInterceptor } from './npi.interceptor';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/any-exception.filter'

export async function startServer(port = 3000) {
  const app = await NestFactory.create(AppModule, {cors: true});
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
          authorizationUrl: process.env.NODE_ENV==='development' ? 'http://localhost:8000/login' : 'http://http://fe-pipeline.open-front.hand-china.com/login',
          // tokenUrl: 'http://localhost:8000/login',
          // refreshUrl: 'http://localhost:8000/login',
          scopes: {
            email: true,
          },
        }
      }
    })
    // .addSecurity('prod-oauth2', {
    //   type: 'oauth2',
    //   flows: {
    //     implicit: {
    //       authorizationUrl: 'http://http://fe-pipeline.open-front.hand-china.com/login',
    //       // tokenUrl: 'http://localhost:8000/login',
    //       // refreshUrl: 'http://localhost:8000/login',
    //       scopes: {
    //         email: true,
    //       },
    //     }
    //   }
    // })
    .build();

  const document = SwaggerModule.createDocument(app, options);

  // ((document as any).oauth2RedirectUrl ) = `/swagger-ui/oauth2-redirect.html`;

  SwaggerModule.setup(SWAGGER_UI_BASE_PATH, app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `/swagger-ui/oauth2-redirect.html`,
      oauth: {
        clientId: process.env.NODE_ENV === 'development' ? "localhost" : 'prod',
      },
    }
  });

  await app.listen(port, '0.0.0.0');
}
