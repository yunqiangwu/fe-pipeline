
import { ApiProperty } from '@nestjs/swagger';
import {  IsString } from 'class-validator';

export class LoginAccountDto {

  @ApiProperty({ required: true, example: 'admin', description: '账号' })
  @IsString()
  readonly username: string;

  @ApiProperty({ required: true, example: 'password', description: '密码' })
  @IsString()
  readonly password: string;
}
