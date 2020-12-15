import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '@/photo/photo.entity';
import { User } from '@/users/users.entity';
import { Workspace } from '@/workspace/workspace.entity';
import { ThreeAccount } from '@/users/three-account.entity';
import { PhotoModule } from '@/photo/photo.module';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { AppController } from '@/app/app.controller';
import { AppService } from '@/app/app.service';
import { ConfigModule } from '@/config/config.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Config } from '@/config/config';
@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    ServeStaticModule.forRoot({
      rootPath: join(Config.singleInstance().get('homeDir'), 'public'),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return {
          ...Config.singleInstance().get('db'),
          entities: [Photo, User, ThreeAccount, Workspace],
          synchronize: true,
        };
      },
    }),
    PhotoModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
