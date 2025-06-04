import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { BadRequestException } from '@nestjs/common';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

jest.mock('argon2');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('createUser', () => {
    const dto = { username: 'test', password: '123456' };

    it('должен создать нового пользователя', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashedPass');

      const savedUser = {
        uuid: '123',
        username: 'test',
        password: 'hashedPass',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.save.mockResolvedValue(savedUser);
      jwtService.sign.mockReturnValue('mockToken');

      const result = await service.createUser(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'test' },
      });
      expect(argon2.hash).toHaveBeenCalledWith('123456');
      expect(userRepository.save).toHaveBeenCalledWith({
        username: 'test',
        password: 'hashedPass',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '123',
        username: 'test',
      });

      expect(result).toMatchObject({
        status: 'success',
        message: 'Пользователь успешно создан',
        user: {
          uuid: '123',
          username: 'test',
          password: 'hashedPass',
        },
        token: 'mockToken',
      });
    });

    it('должен бросить исключение, если пользователь уже существует', async () => {
      userRepository.findOne.mockResolvedValue({
        uuid: 'mock-uuid',
        username: 'test',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.createUser(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
