import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ThreeAccount } from './three-account.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ length: 500 })
  username: string;

  @Column('text')
  email: string;

  @Column('text', {nullable: true})
  avatar?: string;

  @Column('text', {nullable: true})
  password?: string;

  @Column('text', {nullable: true})
  phone?: string;

  @Column('int', {nullable: true})
  sex?: number;

  @OneToMany(() => ThreeAccount, user => user.user)
  threeAccounts: ThreeAccount[];
}
