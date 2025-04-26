import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from 'src/tenant/tenant.service';
import * as bcrypt from 'bcryptjs';
import { Role, User } from 'src/users/entity/users.entity';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from 'src/tenant/entity/tenant.entity';
import { AdminRegisterReqest } from 'src/common/request/admin-register';
import { UserRegisterRequest } from 'src/common/request/user-register';
import { SignInRequest } from 'src/common/request/sign-in';
import { Credentials } from './entity/credentials';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Credentials)
    private readonly credentialsRepository: Repository<Credentials>,

    private tenantService: TenantService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async registerAdminUser(request: AdminRegisterReqest) {
    const { email, name, password, secret } = request;
    const existingUser = await this.usersService.findOneByEmail(request.email);

    if (existingUser) {
      throw new NotFoundException('User already registered.');
    }

    let tenant: Tenant | null = null;

    try {
      tenant = await this.tenantService.createTenant({
        tenantName: name,
        tenantEmail: email,
        secret: secret,
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found.');
      }

      const user = await this.usersService.createUser({
        email,
        name,
        password,
        role: Role.ADMIN,
        tenantId: tenant.id,
      });

      return { user };
    } catch (error) {
      if (tenant && tenant.id) {
        await this.tenantService.deleteTenant(tenant.id);
      }
      throw new InternalServerErrorException(
        error.message || 'Admin registration failed',
      );
    }
  }

  async registerUserUnderTenant(
    request: UserRegisterRequest,
    ip: string,
    userAgent: string,
  ) {
    const { email, name, password, adminEmail } = request;

    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      throw new BadRequestException('User already registered.');
    }

    try {
      const tenant = await this.tenantService.getTenantByAdminEmail(adminEmail);

      if (!tenant) {
        throw new NotFoundException('Tenant not found.');
      }

      const user = await this.usersService.createUser({
        email,
        name,
        password,
        role: Role.VIEWER,
        tenantId: tenant.id,
      });
      const accessToken = this.generateAccessToken(user.id, user.tenantId);
      const refreshToken = this.generateRefreshToken(user.id, tenant.id);


      await this.credentialsRepository.save({
        userId: user.id,
        tenantId: user.tenantId,
        refreshToken,
        ipAddress: ip,
        userAgent,
      });

      return { accessToken, refreshToken, user };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'User registration failed',
      );
    }
  }

  async signIn(values: SignInRequest, ip: string, userAgent: string) {
    try {
      if (!values.email || !values.password) {
        throw new BadRequestException();
      }
      const user = await this.usersService.findOneByEmail(values.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isPasswordMatch = await bcrypt.compare(
        values.password,
        user.password,
      );

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const accessToken = this.generateAccessToken(user.id, user.tenantId);
      const refreshToken = this.generateRefreshToken(user.id, user.tenantId);

      const cred = await this.credentialsRepository.save({
        userId: user.id,
        tenantId: user.tenantId,
        refreshToken,
        ipAddress: ip,
        userAgent,
      });

      const userDTO = user.generateUserDTO();

      return {
        accessToken,
        refreshToken,
        user: userDTO,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Something went wrong', 500);
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.credentialsRepository.update(
        { refreshToken },
        { isRevoked: true },
      );
      return {
        message: 'Logout successful.',
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Something went wrong', 500);
    }
  }


  async refreshAccessToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token is missing.');
      }
  
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
  
      const credentials = await this.credentialsRepository.find({
        where: { 
          isRevoked: false, 
          userId: payload.userId, 
          tenantId: payload.tenantId 
        },
      });
  
      if (!credentials) {
        throw new UnauthorizedException('Token is expired. Login again.');
      }
  
      const accessToken = this.generateAccessToken(payload.userId, payload.tenantId);
    
      return {
        accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      throw new HttpException('Bad request', 400)
    }
  }


  //utils functions
  generateAccessToken(userId: string, tenantId: string) {
    return this.jwtService.sign(
      { userId, tenantId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRY,
      },
    );
  }

  generateRefreshToken(userId: string, tenantId: string) {
    return this.jwtService.sign(
      { userId, tenantId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRY,
      },
    );
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
