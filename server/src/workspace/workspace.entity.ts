import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiBearerAuth } from '@nestjs/swagger';

export type EnvironmentType = 'k8s' | 'docker' | 'host';

// @ApiBearerAuth()
@Entity()
export class Workspace {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ required: false, example: 1, description: '关联用户id' })
  @Column({ type: 'int' })
  userId: number;

  @Column({ length: 500 })
  @ApiProperty({ required: false, description: '工作空间名称' })
  name: string;

  @Column({ nullable: true, length: 20 })
  @ApiProperty({ required: false, example: 'k8s', description: `工作空间类型: 'k8s' | 'docker' | 'host'` })
  environment: EnvironmentType; 

  @Column({ nullable: true, length: 200 })
  image: string;

  @Column({ nullable: true, length: 200 })
  state: 'pending' | 'opening' | 'saved' | 'created' | 'error';

  @Column({ nullable: true, length: 1200 })
  podObject: string;

  @Column({ nullable: true, length: 500 })
  errorMsg: string;

  @Column({ nullable: true, length: 200 })
  gitUrl: string;

  @Column({ nullable: true, length: 20 })
  hostIp: string;

  @Column({ nullable: true, length: 200 })
  hostPassword: string;

  @Column({ nullable: true, length: 20 })
  hostUsername: string;

  @Column({ nullable: true, length: 20 })
  hostPort: string;

}
