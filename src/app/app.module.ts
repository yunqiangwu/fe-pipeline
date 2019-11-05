import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '@/photo/photo.entity';
import { PhotoModule } from '@/photo/photo.module';
import { AppController } from '@/app/app.controller';
import { AppService } from '@/app/app.service';
import { config } from '@/config/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...config.db,
      entities: [Photo],
      synchronize: true,
    }),
    PhotoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
