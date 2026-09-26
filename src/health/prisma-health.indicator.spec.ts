import { Test, TestingModule } from '@nestjs/testing';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckError } from '@nestjs/terminus';

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    indicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when DB query succeeds', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await indicator.isHealthy('database');

      expect(result).toEqual({ database: { status: 'up' } });
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should throw HealthCheckError when DB query fails', async () => {
      const dbError = new Error('Connection refused');
      prisma.$queryRaw.mockRejectedValue(dbError);

      await expect(indicator.isHealthy('database')).rejects.toThrow(
        HealthCheckError,
      );
    });

    it('should include error message in HealthCheckError when DB throws Error', async () => {
      const dbError = new Error('ECONNREFUSED');
      prisma.$queryRaw.mockRejectedValue(dbError);

      try {
        await indicator.isHealthy('database');
      } catch (error) {
        expect(error).toBeInstanceOf(HealthCheckError);
        expect((error as HealthCheckError).message).toContain(
          'Prisma health check failed',
        );
      }
    });

    it('should handle non-Error thrown values', async () => {
      prisma.$queryRaw.mockRejectedValue('string error');

      await expect(indicator.isHealthy('database')).rejects.toThrow(
        HealthCheckError,
      );
    });
  });
});
