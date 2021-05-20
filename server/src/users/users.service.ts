import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pick } from 'lodash';
import { ThreeAccount, Prisma, User } from '@prisma/client'
import { ThreePlatformType } from './enums';
// import { ThreeAccount } from './three-account.entity';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class UsersService {

  constructor(
    private readonly prismaService: PrismaService,
  ) {
  }

  async findThreeAccountInfoByExample(threeAccountExample: ThreeAccount): Promise<ThreeAccount> {
    return this.prismaService.threeAccount.findFirst({
      // select: threeAccountExample,
      include: { user: true }
    })
  }

  async createUser(user: User): Promise<User> {
    return this.prismaService.user.create({
      data: user,
    });
  }

  async updateUser(userInfo: User) {
    if(userInfo.userId) {
      return this.prismaService.user.update({
        where: { userId: userInfo.userId },
        data: userInfo
      });
    } else {
      throw new Error('userInfo.userId not exist!');
    }
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.prismaService.user.findFirst({ where: {username} });
  }

  async findOneByExample(user: Partial<User>): Promise<User | undefined> {
    return this.prismaService.user.findFirst({ where: user });
  }

  async updateOauthBindInfo(options: { threeAccountUsername: string; user: User; loginType: ThreePlatformType; oauthToken: string; accountData: any; tokenInfo?: any; authClientId: string; authHost: string; }) {
    const { user, loginType, authClientId, authHost, oauthToken, threeAccountUsername } = options;

    let threePlatform = await this.prismaService.threeAccount.findFirst({where: { userId: user.userId, threePlatformType: loginType, authClientId } });
    
    if (!threePlatform) {
      threePlatform = {} as any;
      threePlatform.userId = user.userId;
      // if(user.threeAccounts){
      //   user.threeAccounts.push(threePlatform);
      // } else {
      //   user.threeAccounts = [threePlatform];
      // }
    }
    threePlatform.threePlatformType = loginType;
    threePlatform.accessToken = oauthToken;
    threePlatform.authHost = authHost;
    threePlatform.authClientId = authClientId;
    threePlatform.threeAccountUsername = threeAccountUsername;
    threePlatform.accountData = JSON.stringify(options.accountData);
    if(options.tokenInfo) {
      threePlatform.tokenInfo = JSON.stringify(options.tokenInfo);
    }

    const example:Partial<ThreeAccount> = { threePlatformType: threePlatform.threePlatformType, authClientId, userId: user.userId };

    const count = await this.prismaService.threeAccount.count({where: example });
    if(count) {
      await this.prismaService.threeAccount.update({ where: example, data: threePlatform});
    } else {
      await this.prismaService.threeAccount.create({ data: threePlatform });
    }
  }
}