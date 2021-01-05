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
  userId: string;

  @Column({ length: 500 })
  @ApiProperty({ required: false, description: '工作空间名字' })
  name: string;

  @Column({ length: 20 })
  @ApiProperty({ required: false, example: 'k8s', description: `工作空间类型: 'k8s' | 'docker' | 'host'` })
  environment: EnvironmentType; 

  @Column({ length: 200 })
  image: string;

  @Column({ length: 200 })
  gitUrl: string;

  @Column({ length: 20 })
  hostIp: string;

  @Column({ length: 200 })
  hostPassword: string;

  @Column({ length: 20 })
  hostUsername: string;

  @Column({ length: 20 })
  hostPort: string;

}
