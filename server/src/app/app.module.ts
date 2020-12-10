import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '@/photo/photo.entity';
import { User } from '@/users/users.entity';
import { PhotoModule } from '@/photo/photo.module';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { AppController } from '@/app/app.controller';
import { AppService } from '@/app/app.service';
import { config } from '@/config/config';
import { ConfigModule } from '@/config/config.module';
import { join } from 'path';
import { ServeStaticModule, ServeStaticModuleOptions } from '@nestjs/serve-static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(config.homeDir, 'public'),
    }),
    TypeOrmModule.forRoot({
      ...config.db,
      entities: [Photo, User],
      synchronize: true,
    }),
    PhotoModule,
    UsersModule,
    ConfigModule.register({ folder: './config' }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
