import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUserAuthInfoRequest } from 'types/user-request-interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() request: IUserAuthInfoRequest) {
    const { userId, tenantId } = request.user;
    const user = await this.usersService.findOneById(userId);
    return {
      message: 'User Info',
      data: user,
    };
  }
}
