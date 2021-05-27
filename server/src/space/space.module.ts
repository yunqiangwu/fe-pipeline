import { Module } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma.service';
import { MyCacheModule } from 'src/cache/cache.module';
import { SpaceController } from './space.controller';

@Module({
  controllers: [SpaceController],
  providers: [PrismaService],

  imports: [ MyCacheModule]

})
export class SpaceModule {}
