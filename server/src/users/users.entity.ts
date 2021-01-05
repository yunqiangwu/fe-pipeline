import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ThreeAccount } from './three-account.entity';

@Entity()
export class User {
  @ApiProperty({ required: false, example: '1', description: '用户 ID' })
  @PrimaryGeneratedColumn()
  userId: number;

  @ApiProperty({ required: false, example: 'admin', description: '用户名称' })
  @Column({ length: 500 })
  username: string;

  @ApiProperty({ required: false, example: 'admin@xxx.com', description: '用户邮箱' })
  @Column('text')
  email: string;

  @Column('text', {nullable: true})
  @ApiProperty({ required: false, example: 'http://image-url.com/abc.png', description: '用户头像 url 地址' })
  avatar?: string;

  @ApiProperty({ required: false, example: 'password', description: '用户密码' })
  @Column('text', {nullable: true})
  password?: string;

  @ApiProperty({ required: false, example: '1871238492', description: '用户手机号码' })
  @Column('text', {nullable: true})
  phone?: string;

  // @ApiProperty({ required: false, example: '1871238492', description: '用户手机号码' })
  @Column('int', {nullable: true})
  sex?: number;

  @OneToMany(() => ThreeAccount, user => user.user)
  threeAccounts: ThreeAccount[];
}
