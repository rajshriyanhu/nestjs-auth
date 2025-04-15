import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { AdminRegisterReqest } from 'src/common/request/admin-register';
import { UserRegisterRequest } from 'src/common/request/user-register';
import { SignInRequest } from 'src/common/request/sign-in';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-admin')
  @HttpCode(201)
  async registerAdminUser(@Body() request: AdminRegisterReqest) {
    const res = await this.authService.registerAdminUser(request);
    return {
      message: 'Tenant and admin user created successfully.',
      data: res,
    };
  }

  @Public()
  @Post('register-user')
  async registerUser(@Body() request : UserRegisterRequest) {
    const res = await this.authService.registerUserUnderTenant(request);
    return {
      message: "User register successfully",
      data: res
    }
  }

  @Public()
  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() request: SignInRequest) {
    const res = await this.authService.signIn(request);
    return { message: "Login successful.", data: res };
  }

}
