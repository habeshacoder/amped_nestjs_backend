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
      providers: [SearchService, { provide: PrismaService, useValue: prisma }],
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
    prisma.channel.findMany.mockResolvedValue([
      { id: 1, name: 'Science Channel' },
    ]);

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

  it('suggestSellerProfile should search seller profiles by name', async () => {
    prisma.sellerProfile.findMany.mockResolvedValue([
      { id: 1, name: 'Top Seller' },
    ]);

    const result = await service.suggestSellerProfile({ key: 'Top' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.sellerProfile.findMany).toHaveBeenCalled();
  });

  it('suggestProfile should search profiles by first_name', async () => {
    prisma.profile.findMany.mockResolvedValue([{ id: 1, first_name: 'John' }]);

    const result = await service.suggestProfile({ key: 'John' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.profile.findMany).toHaveBeenCalled();
  });

  it('suggestChannelMaterial should search channel materials by title', async () => {
    prisma.channelMaterial.findMany.mockResolvedValue([
      { id: 1, title: 'Lecture 1' },
    ]);

    const result = await service.suggestChannelMaterial({
      key: 'Lecture',
    } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.channelMaterial.findMany).toHaveBeenCalled();
  });

  it('suggestSubscriptionPlan should search subscription plans by name', async () => {
    prisma.subscriptionPlan.findMany.mockResolvedValue([
      { id: 1, name: 'Monthly Pro' },
    ]);

    const result = await service.suggestSubscriptionPlan({
      key: 'Monthly',
    } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalled();
  });

  it('suggestReplays should search replays by replay text', async () => {
    prisma.replay.findMany.mockResolvedValue([
      { id: 1, replay: 'Thank you for feedback' },
    ]);

    const result = await service.suggestReplays({ key: 'feedback' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.replay.findMany).toHaveBeenCalled();
  });

  it('suggestRate should search ratings by remark', async () => {
    prisma.rate.findMany.mockResolvedValue([{ id: 1, remark: 'Great job!' }]);

    const result = await service.suggestRate({ key: 'Great' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.rate.findMany).toHaveBeenCalled();
  });

  it('suggestReport should search reports by report_desc', async () => {
    prisma.report.findMany.mockResolvedValue([
      { id: 1, report_desc: 'Inappropriate content' },
    ]);

    const result = await service.suggestReport({ key: 'content' } as any);
    expect(result.success).toBe(true);
    expect(result.mainMatches).toHaveLength(1);
    expect(prisma.report.findMany).toHaveBeenCalled();
  });

  it('should handle null search key gracefully across methods', async () => {
    const emptyDto = { key: null } as any;
    const res1 = await service.suggest(emptyDto);
    const res2 = await service.suggestChannel(emptyDto);
    const res3 = await service.suggestUser(emptyDto);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res3.success).toBe(true);
  });
});
