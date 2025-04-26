import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entity/users.entity';
import { TenantModule } from './tenant/tenant.module';
import { Tenant } from './tenant/entity/tenant.entity';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/auth.gaurd';
import { JwtModule } from '@nestjs/jwt';
import { Credentials } from './auth/entity/credentials';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_here',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Tenant, Credentials],
        synchronize: true, // don't use this in production
      }),
      inject: [ConfigService],
    }),
    TenantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
