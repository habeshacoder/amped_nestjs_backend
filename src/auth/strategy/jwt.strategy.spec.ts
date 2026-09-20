import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
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
      get: jest.fn().mockReturnValue('test_jwt_secret_key_123'),
    };

    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('should validate and return user without password', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashedpassword',
    };
    prisma.user.findUnique.mockResolvedValue({ ...mockUser });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'test@example.com',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result).toBeDefined();
    expect((result as any)?.password).toBeUndefined();
    expect(result?.id).toBe('user-1');
  });
});
