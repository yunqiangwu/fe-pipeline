// import { NpiInterceptor } from './npi.interceptor';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/any-exception.filter'

export async function startServer(port = 3000) {
  const app = await NestFactory.create(AppModule, {cors: true});
  app.useGlobalFilters(    new AllExceptionsFilter()  );
  await app.listen(port, '0.0.0.0');
}
