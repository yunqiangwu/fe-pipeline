import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { Photo } from './photo.entity';

@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get()
  findAll(): Promise<Photo[]> {
    return this.photoService.findAll();
  }

  @Post()
  save(@Body() photos: Photo[]): Promise<Photo[]> {
    Logger.log(`receive photos: ${photos}`);
    return this.photoService.save(photos);
  }
}
