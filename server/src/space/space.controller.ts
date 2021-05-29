import { Space, SpaceVersion, SpaceVersionAlias, User } from '.prisma/client';
import { Body, CACHE_MANAGER, Controller, Delete, Get, HttpException, Inject, Param, Post, Put, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiParam, ApiBody, ApiOAuth2, ApiQuery } from '@nestjs/swagger';
import { S3 } from 'aws-sdk';
import { Cache } from 'cache-manager';
import { InjectS3 } from 'nestjs-s3';
import { CurrentUser } from 'src/common/decos';
import { PrismaService } from '../app/prisma.service';
import { CreateSpaceDto } from './dto/create-temp-workspace.dto';
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
  async getSpaceByVersionId( @CurrentUser() currentUser, @Param('versionId') versionId: string): Promise<Space> {
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

  @Get('get-file-ls-by-versionid/:versionId')
  @ApiQuery({ required: false, name: 'prefixPath' })
  @UseGuards(AuthGuard('jwt'))
  @ApiOAuth2([])
  async getSpacePathTreeByVersionId( @CurrentUser() currentUser, @Param('versionId') versionId: string, @Query('prefixPath') prefixPath: string = ''): Promise<any> {
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
    if(prefixPath === '/') {
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
    const deleteRes = await this.s3.deleteObjects({
      Bucket: 'bucket',
      // Key: `${space[0].id}/${id}/`,
      Delete: {
        Objects: deleteList.Contents.map(item => ({
          Key: item.Key,
        })),
      },
    }).promise();
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
  @Post('/create-space-version')
  @UseInterceptors(FilesInterceptor('files'))
  async incrementPostViewCount(
    @Body('spaceId') spaceId: string,
    @Body('name') name: string,
    @Body('versionAliasName') versionAliasName: string,
    @CurrentUser() user: User,
    @Body('filesPath') filesPath: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<any> {

    if (!name) {
      throw new Error('丢失 form data：name ');
    }

    if (!versionAliasName) {
      throw new Error('丢失 form data: versionAliasName ');
    }

    if (!filesPath) {
      throw new Error('丢失 form data: filesPath ');
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

    const version = await this.prismaService.spaceVersion.create({
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
          version: version,
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

    return {
      versin: version,
      // files: files[0],
    };
  }

}
