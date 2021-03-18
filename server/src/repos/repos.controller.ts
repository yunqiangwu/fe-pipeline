import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOAuth2, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('repos')
@ApiOAuth2([])
@Controller('api/repos')
export class ReposController {

    @UseGuards(AuthGuard('jwt'))
    @Get()
    // @ApiParam({
    //   name: 'workspace',
    // //   type: Workspace,
    // })
    @ApiResponse({
      status: 200,
      description: 'The found record',
    //   type: [Workspace],
    })
    async getRepos() {
        return [];
    }  

}
