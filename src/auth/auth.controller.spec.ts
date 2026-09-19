import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signup: jest.Mock;
    signin: jest.Mock;
    logout: jest.Mock;
    refreshTokens: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      signin: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.signup', async () => {
    const dto = {
      email: 'user@test.com',
      username: 'user',
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      phoneNo: '1234567890',
    };
    authService.signup.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const result = await controller.signup(dto);
    expect(authService.signup).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('should call authService.signin', async () => {
    const dto = {
      email: 'user@test.com',
      password: 'Password123!',
    };
    authService.signin.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const result = await controller.signin(dto);
    expect(authService.signin).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('should call authService.logout with user id from request', async () => {
    const req = {
      user: { id: 'user-1' },
    } as unknown as Request;
    authService.logout.mockResolvedValue({ id: 'user-1' });

    const result = await controller.logout(req);
    expect(authService.logout).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ id: 'user-1' });
  });

  it('should call authService.refreshTokens with user sub and refreshToken', async () => {
    const req = {
      user: { sub: 'user-1', refreshToken: 'old-rt' },
    } as unknown as Request;
    authService.refreshTokens.mockResolvedValue({
      accessToken: 'new-at',
      refreshToken: 'new-rt',
    });

    const result = await controller.refreshTokens(req);
    expect(authService.refreshTokens).toHaveBeenCalledWith('user-1', 'old-rt');
    expect(result).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' });
  });

  it('should call authService.findAll', async () => {
    authService.findAll.mockResolvedValue([{ id: 'user-1' }]);

    const result = await controller.findAll();
    expect(authService.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'user-1' }]);
  });
});
