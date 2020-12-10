import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

}
