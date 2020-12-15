import { Controller, Get, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PhotoService } from './photo.service';
import { Photo } from './photo.entity';

@ApiTags('photo')
@Controller('api/photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(): Promise<Photo[]> {
    return this.photoService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  save(@Body() photos: Photo[]): Promise<Photo[]> {
    Logger.log(`receive photos: ${photos}`);
    return this.photoService.save(photos);
  }
}
