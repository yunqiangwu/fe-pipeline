import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({username});
  }

  async findOneByExample(user: Partial<User>): Promise<User | undefined> {
    return this.usersRepository.findOne(user);
  }

}