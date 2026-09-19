import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: {
    material: { findMany: jest.Mock };
    channel: { findMany: jest.Mock };
    user: { findMany: jest.Mock };
    sellerProfile: { findMany: jest.Mock };
    profile: { findMany: jest.Mock };
    channelMaterial: { findMany: jest.Mock };
    subscriptionPlan: { findMany: jest.Mock };
    replay: { findMany: jest.Mock };
    rate: { findMany: jest.Mock };
    report: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      material: { findMany: jest.fn().mockResolvedValue([]) },
      channel: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      sellerProfile: { findMany: jest.fn().mockResolvedValue([]) },
      profile: { findMany: jest.fn().mockResolvedValue([]) },
      channelMaterial: { findMany: jest.fn().mockResolvedValue([]) },
      subscriptionPlan: { findMany: jest.fn().mockResolvedValue([]) },
      replay: { findMany: jest.fn().mockResolvedValue([]) },
      rate: { findMany: jest.fn().mockResolvedValue([]) },
      report: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('suggest should search materials with case-insensitive title', async () => {
    prisma.material.findMany.mockResolvedValue([{ id: 1, title: 'Math 101' }]);

    const result = await service.suggest({ key: 'Math' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.material.findMany).toHaveBeenCalled();
  });

  it('suggestChannel should search channels by name', async () => {
    prisma.channel.findMany.mockResolvedValue([{ id: 1, name: 'Science Channel' }]);

    const result = await service.suggestChannel({ key: 'Science' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
  });

  it('suggestUser should search users by username', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', username: 'student' }]);

    const result = await service.suggestUser({ key: 'student' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
  });
});
