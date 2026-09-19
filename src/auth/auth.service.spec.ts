import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwt: {
    signAsync: jest.Mock;
  };
  let config: {
    get: jest.Mock;
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    username: 'testuser',
    password: '$argon2id$v=19$m=65536,t=3,p=4$fakehash',
    phone: '1234567890',
    provider: 'local',
    is_active: true,
    is_verified: true,
    refresh_token: '$argon2id$v=19$m=65536,t=3,p=4$fakerefreshtoken',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    jwt = {
      signAsync: jest.fn().mockImplementation((payload) => {
        return Promise.resolve(`jwt_token_for_${payload.sub}`);
      }),
    };

    config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test_jwt_secret_key_123';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_jwt_secret_key_123';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should successfully register a new user and return tokens', async () => {
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, refresh_token: 'hashed_rf' });

      const dto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        phoneNo: '1234567890',
      };

      const result = await service.signup(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException if email/credentials already taken', async () => {
      const p2002Error = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '4.16.2' },
      );
      prisma.user.create.mockRejectedValue(p2002Error);

      const dto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        phoneNo: '1234567890',
      };

      await expect(service.signup(dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('signin', () => {
    it('should throw ForbiddenException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'nonexistent@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if provider is not local or all', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, provider: 'google' });

      await expect(
        service.signin({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon, 'verify').mockResolvedValue(false);

      await expect(
        service.signin({ email: 'test@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return tokens if credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      jest.spyOn(argon, 'verify').mockResolvedValue(true);

      const result = await service.signin({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should clear refreshToken and return the updated user', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, refresh_token: null });
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, refresh_token: null });

      const result = await service.logout('user-uuid-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { refresh_token: expect.any(String) },
      });
      expect(result).toBeDefined();
    });
  });

  describe('refreshTokens', () => {
    it('should throw ForbiddenException if user or refresh_token is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens('user-uuid-1', 'some_token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon, 'verify').mockResolvedValue(false);

      await expect(
        service.refreshTokens('user-uuid-1', 'invalid_token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return new tokens when refresh token is verified', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      jest.spyOn(argon, 'verify').mockResolvedValue(true);

      const result = await service.refreshTokens('user-uuid-1', 'valid_token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('findAll', () => {
    it('should return all user profiles', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });
});
