
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class AuthInfoWithAuthClientToken {

    @IsString()
    @ApiProperty({ required: true, example: 'xxxx', description: 'token' })
    clientToken;


    @IsString()
    @ApiProperty({ required: true, example: 'open-hand', description: 'clientId' })
    clientId;

}
