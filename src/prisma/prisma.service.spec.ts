import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// We need to mock PrismaClient BEFORE importing PrismaService
// because PrismaService extends PrismaClient.
const mockTransaction = jest
  .fn()
  .mockResolvedValue(['user-deleted', 'reset-deleted']);
const mockUserDeleteMany = jest.fn().mockReturnValue('del-user');
const mockPasswordResetDeleteMany = jest.fn().mockReturnValue('del-reset');

jest.mock('@prisma/client', () => {
  class MockPrismaClient {
    $transaction = mockTransaction;
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    user = { deleteMany: mockUserDeleteMany };
    passwordReset = { deleteMany: mockPasswordResetDeleteMany };

    constructor(_options?: any) {
      // no-op
    }
  }

  return { PrismaClient: MockPrismaClient };
});

// Import AFTER the mock is set up
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'DATABASE_URL')
          return 'postgresql://test:test@localhost:5432/test';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call ConfigService.get with DATABASE_URL during construction', () => {
    expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
  });

  describe('cleanDb', () => {
    it('should call $transaction with user.deleteMany and passwordReset.deleteMany', async () => {
      await service.cleanDb();

      expect(mockUserDeleteMany).toHaveBeenCalled();
      expect(mockPasswordResetDeleteMany).toHaveBeenCalled();
      expect(mockTransaction).toHaveBeenCalledWith(['del-user', 'del-reset']);
    });

    it('should return the transaction result promise', async () => {
      const result = await service.cleanDb();
      expect(result).toEqual(['user-deleted', 'reset-deleted']);
    });
  });
});
