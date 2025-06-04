import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { IUser } from '../users/users.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findUser(username);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const passwordIsMatch = await argon2.verify(user.password, password);
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Недействительные учетные данные');
    }

    return user;
  }

  async login(user: IUser) {
    const { uuid, username } = user;

    return {
      message: 'Вход успешен',
      uuid,
      username,
      token: this.jwtService.sign({
        sub: uuid,
        username,
      }),
    };
  }
}
