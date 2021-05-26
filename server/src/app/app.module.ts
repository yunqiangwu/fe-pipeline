import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from '../users/users.entity';
// import { ThreeAccount } from '../users/three-account.entity';
import { UsersModule } from '../users/users.module';
import * as redisStore from 'cache-manager-redis-store';
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
@Module({
  imports: [

    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: Config.singleInstance().get('redis.endpoint_ip'),  // 'localhost',
        port: Config.singleInstance().get('redis.endpoint_port'),  //6379,
        ttl: 999,
      }),
    }),

    // CacheModule.register({
    //   store: redisStore,
    //   host: 'localhost',
    //   port: 6379,
    // }),

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
    // TypeOrmModule.forRootAsync({
    //   useFactory: async () => {
    //     return {
    //       ...Config.singleInstance().get('db'),
    //       entities: [ User, ThreeAccount],
    //       synchronize: true,
    //     };
    //   },
    // }),

    UsersModule,
    AuthModule,

    EventsModule,

    // WsProxyModule,

  ],
  controllers: [AppController],
  providers: [PrismaService, AppService, 
    // AuthService
  ],
})
export class AppModule {}
