import { Space, User } from '.prisma/client';
import { Body, CACHE_MANAGER, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiParam, ApiBody, ApiOAuth2 } from '@nestjs/swagger';
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
            return list.Contents;
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
          versionId: aliasVersionId,
          spaceId: +spaceId,
          OR: [
            { name: 'latest' },
          ],
        }
      });
      for(const v of aliasVersions) {
        await this.cacheManager.set(`${spaceId}--${v.name}`, `${spaceId}/${v.versionId}`, {
          ttl: 0 // ttl 为 0 表示永久生效
        });
        if(v.name === 'latest') {
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
        return this.prismaService.space.findUnique({ where: { id: Number(id) }, include: { spaceVersionAlias: { include: { version: { select: {name: true} } } }, spaceVersions: { include: { spaceVersionAlias: { select: {name: true} } }, orderBy: { createdAt: 'desc' } }} })
    }

    @ApiParam({required: false, name: 'orderBy', schema: { enum: ['asc', 'desc'] } })
    @ApiParam({required: false, name: 'take'})
    @ApiParam({required: false, name: 'skip'})
    @ApiParam({required: false, name: 'searchString'})
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
                  version: { select: {name: true} }
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

}
