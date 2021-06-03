import { Space, SpaceVersion, SpaceVersionAlias, User } from '.prisma/client';
import { Body, CACHE_MANAGER, Controller, Delete, Get, HttpException, Inject, Param, Res, Req, Post, Put, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiParam, ApiBody, ApiOAuth2, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { S3 } from 'aws-sdk';
import * as AdmZip from 'adm-zip';
import { Cache } from 'cache-manager';
import { InjectS3 } from 'nestjs-s3';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decos';
import { PrismaService } from '../app/prisma.service';
import * as mimetype from 'mimetype';
import { CreateSpaceDto } from './dto/create-temp-workspace.dto';
import fetch from 'node-fetch';
@ApiTags('space')
@Controller('/api/space')
export class SpaceController {

  constructor(
    private readonly prismaService: PrismaService,
    @InjectS3() private readonly s3: S3,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  @Get('minio')
  async getHelloForMinio() {
    try {
      const list = await this.s3.listObjectsV2({ Bucket: 'bucket', Prefix: 'ddd/', Delimiter: '/' }).promise();
      return list;
    } catch (e) {
      console.log(e);
    }
    return 'error';
  }


  @Get('test-cache')
  async testCache() {
    await this.cacheManager.set('aaa', 'fff', {
      ttl: 0 // ttl 为 0 表示永久生效
    });
    return {
      data: (await this.cacheManager.get('aaa'))
    };
  }

  @Get('refresh-space-alias-cache/:id')
  async refreshSpaceAliasCache(@Param('id') spaceId: number, aliasVersionId?: number) {
    console.log(spaceId, aliasVersionId)
    const aliasVersions = await this.prismaService.spaceVersionAlias.findMany({
      where: {
        spaceId: +spaceId,
        ...(aliasVersionId ? {
          AND: [
            { versionId: aliasVersionId, }
          ],
        } : {
          OR: [
            { name: 'latest' },
          ],
        }),
      }
    });
    for (const v of aliasVersions) {
      await this.cacheManager.set(`${spaceId}--${v.name}`, `${spaceId}/${v.versionId}`, {
        ttl: 0 // ttl 为 0 表示永久生效
      });
      if (v.name === 'latest') {
        await this.cacheManager.set(`${spaceId}`, `${spaceId}/${v.versionId}`, {
          ttl: 0 // ttl 为 0 表示永久生效
        });
      }
    }
    return {
      data: aliasVersions.length,
    };
  }

  @Get('get-space/:id')
  async getSpaceById(@Param('id') id: string): Promise<Space> {
    return this.prismaService.space.findUnique({
      where: { id: Number(id) },
      include: {
        spaceVersionAlias: {
          include: { version: { select: { name: true, id: true } } }
        },
        spaceVersions: {
          include: { spaceVersionAlias: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  @Get('get-space-by-versionid/:versionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  async getSpaceByVersionId(@CurrentUser() currentUser, @Param('versionId') versionId: string): Promise<Space> {
    const space = await this.prismaService.space.findMany({
      take: 2,
      include: {
        spaceVersions: {
          where: {
            id: +versionId,
          },
          include: {
            spaceVersionAlias: true,
          }
        },
        spaceVersionAlias: {
          where: {
            name: 'latest'
          }
        }
      },
      where: {
        userId: currentUser?.userId,
        spaceVersions: {
          some: {
            id: +versionId,
          },
        }
      }
    });
    if (!space || space.length !== 1) {
      throw new HttpException('未经授权的操作', 403);
    }
    return space[0];
  }



  @Get('get-zip-by-path')
  @ApiQuery({ required: true, name: 'prefixPath' })
  @UseGuards(JwtAuthGuard)
  @ApiOAuth2([])
  async getSpacePathZipByVersionId(@CurrentUser() currentUser, @Query('prefixPath') prefixPath: string,
    @Req() req: Request, @Res({ passthrough: true }) response: Response): Promise<any> {

    const match = /(\d+)\/(\d+)\/.*/.exec(prefixPath);

    if (!match) {
      throw new HttpException(`Error prefixPath: ${prefixPath}`, 403);
    }

    const [_, spaceId, versionId] = match;

    const space = await this.prismaService.space.findMany({
      take: 2,
      where: {
        userId: currentUser?.userId,
        id: +spaceId,
        spaceVersions: {
          some: {
            id: +versionId,
          },
        }
      }
    });

    if (!space || space.length !== 1) {
      throw new HttpException('未经授权的操作', 403);
    }

    const list = await this.s3.listObjectsV2({ Bucket: 'bucket', Prefix: prefixPath }).promise();

    // // creating archives
    var zip = new AdmZip();

    for (let i = 0; i < list.Contents.length; i++) {
      const item = list.Contents[i];

      const data = await this.s3.getObject({ Bucket: 'bucket', Key: item.Key }).promise();

      zip.addFile(item.Key.replace(prefixPath, ''), Buffer.from(data.Body), item.ETag);
    }


    // // add file directly
    // var content = "inner content of the file";
    // zip.addFile("test.txt", Buffer.alloc(content.length, content), "entry comment goes here");
    // // add local file
    // // zip.addLocalFile("/home/me/some_picture.png");
    // // get everything as a buffer
    // const b = zip.toBuffer();
    // // zip.writeZip()

    response.set({
      'Content-Disposition': `xxx.zip`
    });

    response.end(zip.toBuffer());

    // return {
    //   spaceId, versionId,
    //   list,
    //   // b
    // };
  }


  @Get('get-file-ls-by-versionid/:versionId')
  @ApiQuery({ required: false, name: 'prefixPath' })
  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  async getSpacePathTreeByVersionId(@CurrentUser() currentUser, @Param('versionId') versionId: string, @Query('prefixPath') prefixPath: string = ''): Promise<any> {
    const space = await this.prismaService.space.findMany({
      take: 2,
      where: {
        userId: currentUser?.userId,
        spaceVersions: {
          some: {
            id: +versionId,
          },
        }
      }
    });
    if (!space || space.length !== 1) {
      throw new HttpException('未经授权的操作', 403);
    }
    if (prefixPath === '/') {
      prefixPath = '';
    }
    const list = await this.s3.listObjectsV2({ Bucket: 'bucket', Prefix: `${space[0].id}/${versionId}/${prefixPath ? `${prefixPath}/` : ''}`, Delimiter: '/' }).promise();
    return list;
  }

  @Get('change-or-create-version-alias')
  async changeOrCreateVersionAlias(
    @Query('spaceId') spaceId: string,
    @Query('versionId') versionId: string,
    @Query('aliasName') aliasName: string): Promise<any> {
    const alias = await this.prismaService.spaceVersionAlias.findFirst({
      where: {
        spaceId: +spaceId,
        // versionId: +versionId,
        name: aliasName,
      }
    });
    let res: SpaceVersionAlias;
    if (alias) {
      // @ts-ignore
      res = await this.prismaService.spaceVersionAlias.update({
        where: {
          SpaceVersionAlias_spaceId_name_key: {
            spaceId: +spaceId,
            name: aliasName
          },
        },
        data: {
          version: {
            connect: {
              id: +versionId,
            }
          }
        }
      })
    } else {
      // @ts-ignore
      res = await this.prismaService.spaceVersionAlias.create({
        data: {
          name: aliasName,
          space: {
            connect: {
              id: +spaceId,
            }
          },
          version: {
            connect: {
              id: +versionId,
            }
          }
        }
      });
    }
    if (res?.id) {
      await this.refreshSpaceAliasCache(+spaceId, res?.id)
    }
  }

  @ApiParam({ required: false, name: 'orderBy', schema: { enum: ['asc', 'desc'] } })
  @ApiParam({ required: false, name: 'take' })
  @ApiParam({ required: false, name: 'skip' })
  @ApiParam({ required: false, name: 'searchString' })
  @Get('query')
  async getFilteredSpaces(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
    @Query('searchString') searchString?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ): Promise<Space[]> {
    const or = searchString ? {
      OR: [
        { name: { contains: searchString } },
      ],
    } : {}

    return this.prismaService.space.findMany({
      where: {
        // published: true,
        ...or
      },
      include: {
        spaceVersions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        },
        spaceVersionAlias: {
          where: {
            name: 'latest'
          },
          include: {
            version: { select: { name: true } }
          }
        },
      },
      take: Number(take) || undefined,
      skip: Number(skip) || undefined,
      orderBy: {
        id: orderBy
      }
    })
  }


  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  @Post('create-space')
  @ApiBody({
    // name: 'workspace',
    type: CreateSpaceDto,
    required: true
  })
  async createSpace(
    @CurrentUser() user: User,
    @Body() postData: { name: string; content?: string; },
  ): Promise<Space> {
    const { name, content } = postData;
    const authorEmail = user.email;
    return this.prismaService.space.create({
      data: {
        name,
        // content,
        user: {
          connect: { email: authorEmail },
        },
      },
    })
  }

  @Delete('delete-space/:id')
  async deleteSpace(@Param('id') id: string): Promise<Space> {
    return this.prismaService.space.delete({ where: { id: Number(id) } })
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  @Delete('delete-space-version/:id')
  async deleteSpaceVersion(@CurrentUser() user: User, @Param('id') id: string): Promise<SpaceVersion> {
    const space = await this.prismaService.space.findMany({
      take: 2,
      where: {
        userId: user?.userId,
        spaceVersions: {
          some: {
            id: +id,
          },
        }
      }
    });
    if (!space || space.length !== 1) {
      throw new HttpException('未经授权的操作', 403);
    }
    const res = this.prismaService.spaceVersion.delete({ where: { id: Number(id) } })
    // const deleteRes = await this.s3.deleteObject({
    //   Bucket: 'bucket',
    //   Key: `${space[0].id}/${id}/`,
    // }).promise();
    const deleteKeyPrefix = `${space[0].id}/${id}/`;
    const deleteList = (await this.s3.listObjectsV2({ Bucket: 'bucket', Prefix: deleteKeyPrefix }).promise());
    if(deleteList.Contents.length >= 1) {
      const deleteRes = await this.s3.deleteObjects({
        Bucket: 'bucket',
        // Key: `${space[0].id}/${id}/`,
        Delete: {
          Objects: deleteList.Contents.map(item => ({
            Key: item.Key,
          })),
        },
      }).promise();
    }

    // console.log(deleteRes);
    // throw new Error('test');
    return res;
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  @Delete('delete-space-version-alias/:id')
  async deleteSpaceVersionAlias(@Param('id') id: string): Promise<SpaceVersionAlias> {
    return this.prismaService.spaceVersionAlias.delete({ where: { id: Number(id) } })
  }

  //   @Put('/increment-space/:id/views')
  //   async incrementPostViewCount(@Param('id') id: string): Promise<Space> {
  //     return this.prismaService.space.update({
  //       where: { id: Number(id) },
  //       data: {
  //         viewCount: {
  //           increment: 1
  //         }
  //       }
  //     })
  //   }

  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  @ApiParam({ required: false, name: 'versionId' })
  @ApiParam({ required: false, name: 'versionAliasName' })
  @Post('/create-space-version')
  @UseInterceptors(FilesInterceptor('files'))
  async publishSpaceVersion(
    @Body('spaceId') spaceId: string,
    @Body('name') name: string,
    @Body('isZip') isZip: string,
    @Body('versionId') versionId: string,
    @Body('versionAliasName') versionAliasName: string,
    @CurrentUser() user: User,
    @Body('filesPath') filesPath: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<any> {

    if (!name) {
      throw new Error('丢失 form data：name ');
    }

    if (!(versionAliasName || versionId)) {
      throw new Error('丢失 form data: versionAliasName ');
    }

    if (!filesPath) {
      throw new Error('丢失 form data: filesPath ');
    }

    if(isZip === '1') {
      if(files.length !== 1 || !files[0].originalname.endsWith('.zip')) {
        throw new Error('请上传一个 zip 文件');
      }
      const zip = new AdmZip(files[0].buffer);
      if(zip.getEntries().length < 1){
        throw new Error('zip 内容为空');
      }
    }

    const filePathArray: string[] = JSON.parse(filesPath);

    if (filePathArray.length !== (files || []).length) {
      throw new Error('filesPath 的长度 和 files 长度不匹配 ');
    }

    const space = await this.prismaService.space.findUnique({
      where: { id: +spaceId }
    });

    if (!space || space.userId !== user.userId) {
      throw new HttpException('未授权', 403);
    }

    let version: SpaceVersion = null;

    if(versionId) {
      version = await this.prismaService.spaceVersion.findUnique({
        where: {
          id: +versionId,
        }
      });
      if(!version || version.spaceId !== +spaceId) {
        throw new HttpException('未授权', 403);
      }
    } else {
      version = await this.prismaService.spaceVersion.create({
        data: {
          name,
          space: {
            connect: {
              id: +spaceId,
            },
          },
          spaceVersionAlias: {
            connectOrCreate: {
              where: {
                SpaceVersionAlias_spaceId_name_key: {
                  name: versionAliasName,
                  spaceId: +spaceId,
                },
              },
              create: {
                name: versionAliasName,
                space: {
                  connect: {
                    id: +spaceId,
                  },
                }
              }
            },
          }
        },
      });
    }

    if(isZip === '1') {
      await this.uploadZipToVersionSpace(spaceId, "1", "", `${version.id}`, user, files);
    } else {
      for (let i = 0; i < filePathArray.length; i++) {
        const filePath = filePathArray[i];
        const file = files[i];
        // console.log(file);
        await this.s3.putObject({
          Bucket: 'bucket',
          Key: `${spaceId}/${version.id}/${filePath || file.originalname}`,
          Body: file.buffer,
          ContentDisposition: file.mimetype,
          ContentType: file.mimetype,
        }).promise();
      }
  
      if (version?.id && versionAliasName) {
        const alias = await this.prismaService.spaceVersionAlias.findFirst({
          where: {
            versionId: version.id,
            // version: version,
            spaceId: +spaceId,
          },
          select: {
            id: true,
          }
        })
        if (alias) {
          await this.refreshSpaceAliasCache(+spaceId, alias.id);
        }
      }
    }

    return {
      versin: version,
      // files: files[0],
    };
  }


  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  @Post('/upload-zip-to-version')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadZipToVersionSpace(
    @Body('spaceId') spaceId: string,
    @Body('isResetFiles') isResetFiles: string,
    @Body('prefixPath') prefixPath: string = '',
    @Body('versionId') versionId: string,
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<any> {

    spaceId = spaceId.trim();
    versionId = versionId.trim();
    prefixPath = prefixPath.trim();

    const space = await this.prismaService.space.findUnique({
      where: {
        id: +spaceId,
      }
    });

    if (!space || space.userId !== user.userId) {
      throw new HttpException('未授权', 403);
    }

    if (prefixPath === '/') {
      prefixPath = '';
    }

    var zip = new AdmZip(files[0].buffer);

    var zipEntries = zip.getEntries(); // an array of ZipEntry records

    if(isResetFiles === '1') {
      const deleteKeyPrefix = `${spaceId}/${versionId}/${prefixPath}/`.replace('//', "/");
      const deleteList = (await this.s3.listObjectsV2({ Bucket: 'bucket', Prefix: deleteKeyPrefix }).promise());
      if(deleteList.Contents.length >= 1) {
        const deleteRes = await this.s3.deleteObjects({
          Bucket: 'bucket',
          // Key: `${space[0].id}/${id}/`,
          Delete: {
            Objects: deleteList.Contents.map(item => ({
              Key: item.Key,
            })),
          },
        }).promise();
      }
    }

    const promises = [];

    zipEntries.forEach( (zipEntry) => {
      if(!zipEntry.isDirectory) {
        let type = mimetype.lookup(zipEntry.entryName);
        if(!type) {
          type = undefined;
        }
        // console.log(`${spaceId}/${versionId}/${prefixPath}/${zipEntry.entryName.replace(/^\//, '')}`.replace('//', "/"));
        const p = this.s3.putObject({
          Bucket: 'bucket',
          Key: `${spaceId}/${versionId}/${prefixPath}/${zipEntry.entryName.replace(/^\//, '')}`.replace('//', "/"),
          Body: zipEntry.getData(),
          ContentDisposition: type,
          ContentType: type,
        }).promise();
        promises.push(p);
      }
    });

    await Promise.all(promises);
    return {
      // versin: version,
      // files: files[0],
    };
  }

}
