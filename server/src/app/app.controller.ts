import { Controller, Request, Post, Get, UseGuards, Headers, Param, Body, Query, Delete, Put } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOAuth2 } from '@nestjs/swagger';
import { omit } from 'lodash';
import { InjectS3, S3 } from 'nestjs-s3';
import { AppService } from '../app/app.service';
import { User as UserModel, Post as PostModel, Prisma } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from './prisma.service';

@ApiTags('fe-pipeline')
@Controller('/api')
export class AppController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly appService: AppService,
    @InjectS3() private readonly s3: S3,
  ) { }

  @Get('hello')
  @ApiResponse({
    status: 200,
    description: 'Hello String',
    type: String,
  })
  getHello(): string {
    // console.log(req);
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('config')
  @ApiOAuth2([])
  @ApiResponse({
    status: 200,
    description: 'Config',
    type: Object,
  })
  getConfig(): any {
    return omit(this.appService.getConfig(), ['auth']);
  }


  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.prismaService.post.findUnique({ where: { id: Number(id) } })
  }

  @Get('feed')
  async getFilteredPosts(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
    @Query('searchString') searchString?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ): Promise<PostModel[]> {
    const or = searchString ? {
      OR: [
        { title: { contains: searchString } },
        { content: { contains: searchString } },
      ],
    } : {}

    return this.prismaService.post.findMany({
      where: {
        published: true,
        ...or
      },
      include: { author: true },
      take: Number(take) || undefined,
      skip: Number(skip) || undefined,
      orderBy: {
        updatedAt: orderBy
      }
    })
  }

  // @Get('users')
  // async getAllUsers(): Promise<UserModel[]> {
  //   return this.prismaService.user.findMany()
  // }

  @Get('user/:id/drafts')
  async getDraftsByUser(@Param('id') id: string): Promise<PostModel[]> {
    return this.prismaService.user.findUnique({
      where: { userId: Number(id) }
    }).posts({
      where: {
        published: false
      }
    })
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData
    return this.prismaService.post.create({
      data: {
        title,
        content,
        author: {
          connect: { email: authorEmail },
        },
      },
    })
  }

  @Post('signup')
  async signupUser(
    @Body() userData: { username?: string; email: string, posts?: PostModel[] },
  ): Promise<UserModel> {

    const postData = userData.posts?.map((post) => {
      return { title: post?.title, content: post?.content }
    })
    return this.prismaService.user.create({
      data: {
        username: userData?.username,
        email: userData.email,
        posts: {
          create: postData
        }
      },
    })
  }

  @Put('publish/:id')
  async togglePublishPost(@Param('id') id: string): Promise<PostModel> {

    const postData = await this.prismaService.post.findUnique({
      where: { id: Number(id) },
      select: {
        published: true
      }
    })

    return this.prismaService.post.update({
      where: { id: Number(id) || undefined },
      data: { published: !postData?.published },
    })
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.prismaService.post.delete({ where: { id: Number(id) } })
  }

  @Put('/post/:id/views')
  async incrementPostViewCount(@Param('id') id: string): Promise<PostModel> {
    return this.prismaService.post.update({
      where: { id: Number(id) },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })
  }

  @Get('minio')
  async getHelloForMinio() {
    try {
      await this.s3.createBucket({ Bucket: 'bucket' }).promise();
     
    } catch (e) { 
      // console.error(e);
    }

    await this.s3.putObject({ Bucket: 'bucket', Key: 'xx', Body: 'asdf' }).promise();

    const res = await this.s3.getObject({ Bucket: 'bucket', Key: 'xx' }).promise();

    console.log('res:', res);

    try {
      const list = await this.s3.listBuckets().promise();

      return list.Buckets;
    } catch (e) {
      console.log(e);
    }

    return 'error';
  }


}
