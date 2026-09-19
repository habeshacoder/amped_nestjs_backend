import { RefreshTokenStrategy } from './refreshToken.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let config: {
    get: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    config = {
      get: jest.fn().mockReturnValue('test_refresh_jwt_secret_key_123'),
    };

    strategy = new RefreshTokenStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('should extract refresh token from Authorization header and return payload with refreshToken', () => {
    const req = {
      get: jest.fn().mockReturnValue('Bearer sample_refresh_token_123'),
    } as unknown as Request;

    const payload = { sub: 'user-1', email: 'test@example.com' };

    const result = strategy.validate(req, payload);

    expect(result).toEqual({
      sub: 'user-1',
      email: 'test@example.com',
      refreshToken: 'sample_refresh_token_123',
    });
  });
});
