
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { Workspace } from '../workspace.entity';

export class CreateTempWorkspaceDto extends Workspace {

  // @IsString()
  // @ApiProperty({ required: true, example: 'xxxx', description: 'token' })
  // readonly access_token: string;

  // @IsInt()
  // @ApiProperty({ required: true, example: '1', description: '用户 ID' })
  // readonly sub: number;

  // @ApiProperty({ required: true, example: 'admin', description: '用户名' })
  // @IsString()
  // readonly username: string;

  @IsString()
  @ApiProperty({ required: false, example: 'xxxx', description: 'token' })
  clientToken?;


  @IsString()
  @ApiProperty({ required: false, example: 'open-hand', description: 'clientId' })
  clientId?;

}
