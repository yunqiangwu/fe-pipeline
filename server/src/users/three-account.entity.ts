import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ThreePlatformType } from './enums';
import { User } from './users.entity';


@Entity()
export class ThreeAccount {


  @Column({primary: true, length: 500})
  threePlatformType: ThreePlatformType;

  @Column('text')
  accessToken: string;

  @Column('text', {nullable: true})
  accountData?: string;

  @ManyToOne(() => User, user => user.threeAccounts, { primary: true })
  user: User;

}
