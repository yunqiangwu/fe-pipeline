import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '@/photo/photo.entity';
import { PhotoModule } from '@/photo/photo.module';
import { AppController } from '@/app/app.controller';
import { AppService } from '@/app/app.service';
import { config } from '@/config/config';
import { ConfigModule } from '@/config/config.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(config.homeDir, 'public'),
      renderPath: '/public/',
    }),
    TypeOrmModule.forRoot({
      ...config.db,
      entities: [Photo],
      synchronize: true,
    }),
    PhotoModule,
    ConfigModule.register({ folder: './config' }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
