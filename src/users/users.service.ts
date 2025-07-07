import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const existUser = await this.userRepository.findOne({
      where: {
        username: createUserDto.username,
      },
    });
    if (existUser) {
      throw new BadRequestException('Это имя пользователя уже существует');
    }

    const user = await this.userRepository.save({
      username: createUserDto.username,
      password: await argon2.hash(createUserDto.password),
    });

    const token = this.jwtService.sign({
      sub: user.uuid,
      username: user.username,
    });

    return {
      status: 'success',
      message: 'Пользователь успешно создан',
      user,
      token,
    };
  }

  async findUser(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }

  async findByUUID(uuid: string): Promise<User | null> {
    return this.userRepository.findOneBy({ uuid });
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async searchUsers(query: string) {
    return this.userRepository.find({
      where: {
        username: ILike(`%${query}%`),
      },
      take: 10,
    });
  }
}
