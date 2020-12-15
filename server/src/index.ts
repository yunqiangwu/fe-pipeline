// import { NpiInterceptor } from './npi.interceptor';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/any-exception.filter'

export async function startServer(port = 3000) {
  const app = await NestFactory.create(AppModule, {cors: true});
  app.useGlobalFilters(  new AllExceptionsFilter()  );

  const options = new DocumentBuilder()
    .setTitle('Fe Pipeline')
    .setDescription('The Fe Pipeline API description')
    .setVersion('1.0')
    .addTag('fe-pipeline')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger-ui', app, document);


  await app.listen(port, '0.0.0.0');
}
