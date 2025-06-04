import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('должен вернуть токен после логина', async () => {
      const user = { uuid: '123', username: 'test' };
      const req = { user };
      const token = { access_token: 'mockToken' };

      mockAuthService.login.mockResolvedValue(token);

      const result = await controller.login(req as any);

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(token);
    });
  });

  describe('getProfile', () => {
    it('должен вернуть пользователя из запроса', () => {
      const req = { user: { uuid: '123', username: 'test' } };
      const result = controller.getProfile(req as any);
      expect(result).toEqual(req.user);
    });
  });
});
