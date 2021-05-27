import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from '../users/users.entity';
// import { ThreeAccount } from '../users/three-account.entity';
import { UsersModule } from '../users/users.module';
import { WsProxyModule } from '../ws-proxy/ws-proxy.module';
import { S3Module } from 'nestjs-s3';
import { AuthModule } from '../auth/auth.module';
// import { AuthService } from '../auth/auth.service';
import { AppController } from '../app/app.controller';
import { PrismaService } from '../app/prisma.service';
import { AppService } from '../app/app.service';
import { EventsModule } from '../events/events.module';
import { ConfigModule } from '../config/config.module';
import { join } from 'path';
// import { ServeStaticModule } from '@nestjs/serve-static';
import { Config } from '../config/config';
import { SpaceModule } from 'src/space/space.module';
import { MyCacheModule } from 'src/cache/cache.module';
@Module({
  imports: [

    MyCacheModule,

    S3Module.forRootAsync({
      useFactory: () => ({
        config: {
          accessKeyId: Config.singleInstance().get('minio.accessKey'),
          secretAccessKey: Config.singleInstance().get('minio.secretKey'),
          endpoint: Config.singleInstance().get('minio.endpoint'),
          s3ForcePathStyle: true,
          signatureVersion: 'v4',
        },
      }),
    }),

    ConfigModule.register({ folder: './config' }),

    UsersModule,
    AuthModule,

    SpaceModule,

    EventsModule,

    // WsProxyModule,

  ],
  controllers: [AppController],
  providers: [PrismaService, AppService, 
    // AuthService
  ],
})
export class AppModule {}
