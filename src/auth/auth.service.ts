import {
  BadRequestException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private tenantService: TenantService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async registerAdminUser(request: AdminRegisterReqest) {
    const { email, name, password, secret } = request;
    const existingUser = await this.userRepository.findOneBy({
      email: request.email,
    });

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

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        name: name,
        email: email,
        password: hashedPassword,
        role: Role.ADMIN,
        tenantId: tenant.id,
      });

      await this.userRepository.save(user);

      const userDTO = user.generateUserDTO();
      const token = this.generateToken(user.id, user.tenantId);
      return {token, userDTO};

    } 
    catch (error) {
      if (tenant && tenant.id) {
        await this.tenantService.deleteTenant(tenant.id);
      }
      throw new InternalServerErrorException(
        error.message || 'Admin registration failed',
      );
    }
  }

  async registerUserUnderTenant(request: UserRegisterRequest) {
    const { email, name, password, adminEmail } = request;

    const existingUser = await this.userRepository.findOneBy({
      email: email,
    });

    if (existingUser) {
      throw new BadRequestException('User already registered.');
    }

    try {
      const tenant = await this.tenantService.getTenantByAdminEmail(adminEmail);

      if (!tenant) {
        throw new NotFoundException('Tenant not found.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        name: name,
        email: email,
        password: hashedPassword,
        role: Role.VIEWER,
        tenantId: tenant.id,
      });

      await this.userRepository.save(user);

      const userDTO = user.generateUserDTO();
      const token = this.generateToken(user.id, user.tenantId);
      
      return {token, userDTO};
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'User registration failed',
      );
    }
  }

  async signIn(values: SignInRequest) {
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

    const token = this.generateToken(user.id, user.tenantId);

    const { password, ...safeUser } = user;

    return {
      access_token: token,
      user: safeUser,
    };
  }


  generateToken(userId: string, tenantId: string) {
    return this.jwtService.sign({
      userId,
      tenantId,
    },  {
      secret: process.env.JWT_SECRET,
    });
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
