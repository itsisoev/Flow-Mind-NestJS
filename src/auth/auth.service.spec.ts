import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    const username = 'testuser';
    const password = 'password123';
    const hashedPassword = 'hashedPass';

    it('должен выбросить UnauthorizedException если пользователь не найден', async () => {
      (usersService.findUser as jest.Mock).mockResolvedValue(null);

      await expect(service.validateUser(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findUser).toHaveBeenCalledWith(username);
    });

    it('должен выбросить UnauthorizedException если пароль не совпадает', async () => {
      (usersService.findUser as jest.Mock).mockResolvedValue({
        username,
        password: hashedPassword,
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
    });

    it('должен вернуть пользователя если пароль совпадает', async () => {
      const user = { uuid: '123', username, password: hashedPassword };
      (usersService.findUser as jest.Mock).mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(username, password);

      expect(result).toEqual(user);
      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
    });
  });

  describe('login', () => {
    it('должен вернуть объект с токеном и информацией о пользователе', async () => {
      const user = { uuid: 'uuid123', username: 'testuser' };
      (jwtService.sign as jest.Mock).mockReturnValue('mockToken');

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.uuid,
        username: user.username,
      });
      expect(result).toEqual({
        message: 'Вход успешен',
        uuid: user.uuid,
        username: user.username,
        token: 'mockToken',
      });
    });
  });
});
