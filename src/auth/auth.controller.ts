import {
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { AdminRegisterReqest } from 'src/common/request/admin-register';
import { UserRegisterRequest } from 'src/common/request/user-register';
import { SignInRequest } from 'src/common/request/sign-in';
import { Request, Response } from 'express';
import * as requestIp from 'request-ip';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-admin')
  @HttpCode(201)
  async registerAdminUser(@Body() body: AdminRegisterReqest) {
    const res = await this.authService.registerAdminUser(body);
    return {
      message: 'Tenant and admin user created successfully.',
      data: res,
    };
  }

  @Public()
  @Post('register-user')
  @HttpCode(201)
  async registerUser(
    @Req() request: Request,
    @Body() body: UserRegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ip = requestIp.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';
    const res = await this.authService.registerUserUnderTenant(
      body,
      ip,
      userAgent,
    );

    response.cookie('accessToken', res.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refreshToken', res.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: 'User register successfully',
      data: res.user,
    };
  }

  @Public()
  @Post('sign-in')
  @HttpCode(200)
  async signIn(
    @Req() request: Request,
    @Body() body: SignInRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ip = requestIp.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';
    const res = await this.authService.signIn(body, ip, userAgent);

    response.cookie('accessToken', res.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refreshToken', res.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { message: 'Login successful.', data: res.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refreshAccessToken(@Req() request: Request, @Res({passthrough: true}) response: Response) {
    const refreshToken = request.cookies?.refreshToken;

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Tokens refreshed successfully.' };
  }

  @Public()
  @Post('sign-out')
  @HttpCode(200)
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found.');
    }

    await this.authService.logout(refreshToken);

    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logout successful.' };
  }
}
