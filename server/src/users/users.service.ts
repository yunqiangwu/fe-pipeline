import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pick } from 'lodash';
import { ThreePlatformType } from './enums';
import { ThreeAccount } from './three-account.entity';
import { User } from './users.entity';

@Injectable()
export class UsersService {

  async createUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async updateUser(userInfo: User) {
    if(userInfo.userId) {
      return this.usersRepository.update({ userId: userInfo.userId }, userInfo);
    } else {
      throw new Error('userInfo.userId not exist!');
    }
  }

  private readonly users: User[];

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ThreeAccount)
    private readonly threeAccountRepository: Repository<ThreeAccount>,
  ) {
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({username});
  }

  async findOneByExample(user: Partial<User>): Promise<User | undefined> {
    return this.usersRepository.findOne(user);
  }

  async updateOauthBindInfo(options: { user: User; loginType: ThreePlatformType; oauthToken: string; accountData: any; }) {
    const { user, loginType, oauthToken } = options;
    let threePlatform = user.threeAccounts && user.threeAccounts.find(item => item.threePlatformType === loginType);
    if (!threePlatform) {
      threePlatform = new ThreeAccount();
      // threePlatform.userId = user.userId;
      threePlatform.user = user;
      if(user.threeAccounts){
        user.threeAccounts.push(threePlatform);
      } else {
        user.threeAccounts = [threePlatform];
      }
    }
    threePlatform.threePlatformType = loginType;
    threePlatform.accessToken = oauthToken;
    threePlatform.accountData = JSON.stringify(options.accountData);

    const example = { threePlatformType: threePlatform.threePlatformType, user: threePlatform.user };

    const count = await this.threeAccountRepository.count(example);
    if(count) {
      await this.threeAccountRepository.update(example, threePlatform);
    } else {
      await this.threeAccountRepository.save(threePlatform);
    }
  }
}