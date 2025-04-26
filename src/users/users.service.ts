import { HttpException, Injectable } from '@nestjs/common';
import { Role, User } from './entity/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDTO } from 'src/common/dto/user';
import { CreateUserRequest } from 'src/common/request/create-user';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(req: CreateUserRequest) {
    const hashedPassword = await bcrypt.hash(req.password, 10);

    const user = this.userRepository.create({
      name: req.name,
      email: req.email,
      password: hashedPassword,
      role: req.role,
      tenantId: req.tenantId,
    });

    await this.userRepository.save(user);

    return user.generateUserDTO();
  }

  // this fucntion to be user in other services only
  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({
      email,
    });
    // if (!user) throw new HttpException('User not found.', 404);

    return user;
  }

  async findOneById(id: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findOneBy({
      id,
    });
    if (!user) throw new HttpException('User not found.', 404);

    const userDTO = user.generateUserDTO();
    return userDTO;
  }
}
