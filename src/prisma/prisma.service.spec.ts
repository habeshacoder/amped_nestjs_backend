import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') {
          return 'postgresql://user:pass@localhost:5432/testdb';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new PrismaService(mockConfigService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it('should be defined and initialize with database url from config', () => {
    expect(service).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('should connect to database on onModuleInit', async () => {
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValueOnce(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should disconnect from database on onModuleDestroy for graceful shutdown', async () => {
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValueOnce(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('should clean tables within transaction in cleanDb', async () => {
    const userDeleteManySpy = jest.fn().mockResolvedValue({ count: 5 });
    const passwordResetDeleteManySpy = jest
      .fn()
      .mockResolvedValue({ count: 2 });

    (service as any).user = { deleteMany: userDeleteManySpy };
    (service as any).passwordReset = {
      deleteMany: passwordResetDeleteManySpy,
    };

    const transactionSpy = jest
      .spyOn(service, '$transaction')
      .mockResolvedValueOnce([{ count: 5 }, { count: 2 }] as any);

    const result = await service.cleanDb();

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ count: 5 }, { count: 2 }]);
  });
});
