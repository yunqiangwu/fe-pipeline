
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { Workspace } from '../workspace.entity';

export class CreateTempWorkspaceDtoResp {

  // @IsString()
  // @ApiProperty({ required: true, example: 'xxxx', description: 'token' })
  // readonly access_token: string;

  // @IsInt()
  // @ApiProperty({ required: true, example: '1', description: '用户 ID' })
  // readonly sub: number;

  // @ApiProperty({ required: true, example: 'admin', description: '用户名' })
  // @IsString()
  // readonly username: string;

  @ApiProperty({ description: 'Workspace' })
  ws?: Workspace;
}
