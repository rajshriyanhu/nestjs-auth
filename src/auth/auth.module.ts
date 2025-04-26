import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entity/users.entity';
import { Tenant } from 'src/tenant/entity/tenant.entity';
import { TenantService } from 'src/tenant/tenant.service';
import { Credentials } from './entity/credentials';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Tenant]),
    TypeOrmModule.forFeature([Credentials]),
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, TenantService]
})
export class AuthModule {}
