import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { Workspace } from '../workspace/workspace.entity';
import { ThreeAccount } from '../users/three-account.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthService } from '../auth/auth.service';
import { AppController } from '../app/app.controller';
import { AppService } from '../app/app.service';
import { ConfigModule } from '../config/config.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Config } from '../config/config';
@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    ServeStaticModule.forRoot({
      rootPath: join(Config.singleInstance().get('homeDir'), 'public'),
      // renderPath: '/app/*',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return {
          ...Config.singleInstance().get('db'),
          entities: [ User, ThreeAccount, Workspace],
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    WorkspaceModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
