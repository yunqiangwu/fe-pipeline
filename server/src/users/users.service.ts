import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pick } from 'lodash';
import { ThreeAccount, Prisma } from '@prisma/client'
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

  // async createUser(user: User): Promise<User> {
  //   return this.usersRepository.save(user);
  // }

  // async updateUser(userInfo: User) {
  //   if(userInfo.userId) {
  //     return this.usersRepository.update({ userId: userInfo.userId }, userInfo);
  //   } else {
  //     throw new Error('userInfo.userId not exist!');
  //   }
  // }

  // private readonly users: User[];



  // async findOne(username: string): Promise<User | undefined> {
  //   return this.usersRepository.findOne({username});
  // }

  // async findOneByExample(user: Partial<User>): Promise<User | undefined> {
  //   return this.usersRepository.findOne(user);
  // }

  // async updateOauthBindInfo(options: { threeAccountUsername: string; user: User; loginType: ThreePlatformType; oauthToken: string; accountData: any; tokenInfo?: any; authClientId: string; authHost: string; }) {
  //   const { user, loginType, authClientId, authHost, oauthToken, threeAccountUsername } = options;
  //   let threePlatform = user.threeAccounts && user.threeAccounts.find(item => item.threePlatformType === loginType);
  //   if (!threePlatform) {
  //     threePlatform = new ThreeAccount();
  //     // threePlatform.userId = user.userId;
  //     threePlatform.user = user;
  //     if(user.threeAccounts){
  //       user.threeAccounts.push(threePlatform);
  //     } else {
  //       user.threeAccounts = [threePlatform];
  //     }
  //   }
  //   threePlatform.threePlatformType = loginType;
  //   threePlatform.accessToken = oauthToken;
  //   threePlatform.authHost = authHost;
  //   threePlatform.authClientId = authClientId;
  //   threePlatform.threeAccountUsername = threeAccountUsername;
  //   threePlatform.accountData = JSON.stringify(options.accountData);
  //   if(options.tokenInfo) {
  //     threePlatform.tokenInfo = JSON.stringify(options.tokenInfo);
  //   }

  //   const example:Partial<ThreeAccount> = { threePlatformType: threePlatform.threePlatformType, authClientId, user: threePlatform.user };

  //   const count = await this.threeAccountRepository.count(example);
  //   if(count) {
  //     await this.threeAccountRepository.update(example, threePlatform);
  //   } else {
  //     await this.threeAccountRepository.save(threePlatform);
  //   }
  // }
}