import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { PrismaService } from '../prisma/prisma.service';

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prismaService: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    indicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  it('should return healthy status when $queryRaw succeeds', async () => {
    prismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const result = await indicator.isHealthy('database');
    expect(result).toEqual({
      database: { status: 'up' },
    });
    expect(prismaService.$queryRaw).toHaveBeenCalled();
  });

  it('should throw HealthCheckError when database query fails with Error instance', async () => {
    prismaService.$queryRaw.mockRejectedValue(new Error('Connection lost'));

    await expect(indicator.isHealthy('database')).rejects.toThrow(
      HealthCheckError,
    );
  });

  it('should throw HealthCheckError with fallback message when non-error thrown', async () => {
    prismaService.$queryRaw.mockRejectedValue('unknown failure');

    await expect(indicator.isHealthy('database')).rejects.toThrow(
      HealthCheckError,
    );
  });
});
