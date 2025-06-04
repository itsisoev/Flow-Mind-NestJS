import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('createUser', () => {
    it('должен вызывать UsersService.createUser и возвращать результат', async () => {
      const dto: CreateUserDto = { username: 'testuser', password: '123456' };
      const expectedResult = {
        status: 'success',
        message: 'Пользователь создан',
      };

      usersService.createUser!.mockResolvedValue(expectedResult);

      const result = await controller.createUser(dto);

      expect(usersService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
