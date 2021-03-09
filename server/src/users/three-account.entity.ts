import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ThreePlatformType } from './enums';
import { User } from './users.entity';


@Entity()
export class ThreeAccount {

  @Column({primary: true, length: 500})
  threePlatformType: ThreePlatformType;

  @Column({length: 50})
  authHost: string;

  @Column({primary: true, length: 50})
  authClientId: string;

  @Column({type:'text', length: 50})
  threeAccountUsername: string;

  @Column('text')
  accessToken: string;

  @Column('text', {nullable: true})
  tokenInfo?: string;

  @Column('text', {nullable: true})
  accountData?: string;

  @ManyToOne(() => User, user => user.threeAccounts, { primary: true })
  user: User;

}
