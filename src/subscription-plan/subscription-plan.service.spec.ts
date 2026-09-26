import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanService } from './subscription-plan.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('SubscriptionPlanService', () => {
  let service: SubscriptionPlanService;
  let prisma: {
    subscriptionPlan: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    channel: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
    materialInSubscriptionPlan: {
      findMany: jest.Mock;
    };
  };

  const mockPlan = {
    id: 1,
    name: 'Basic Plan',
    description: 'Basic access',
    price: 100,
    channel_id: 5,
    material_in_subscription_plan: [] as any[],
  };

  beforeEach(async () => {
    prisma = {
      subscriptionPlan: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      channel: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      materialInSubscriptionPlan: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubscriptionPlanService>(SubscriptionPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create plans and update channel draft status', async () => {
      prisma.subscriptionPlan.create.mockResolvedValue(mockPlan);
      prisma.channel.update.mockResolvedValue({ id: 5, draft: false });
      prisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan]);

      const dto = {
        name: ['Basic Plan'],
        description: ['Basic access'],
        price: ['100'],
        channel_id: ['5'],
      };

      const result = await service.create(dto as any);
      expect(prisma.subscriptionPlan.create).toHaveBeenCalled();
      expect(prisma.channel.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { draft: false },
      });
      expect(result).toEqual([mockPlan]);
    });

    it('should create multiple plans in a loop', async () => {
      prisma.subscriptionPlan.create.mockResolvedValue(mockPlan);
      prisma.channel.update.mockResolvedValue({ id: 5, draft: false });
      prisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan, mockPlan]);

      const dto = {
        name: ['Basic', 'Pro'],
        description: ['Basic access', 'Pro access'],
        price: ['100', '200'],
        channel_id: ['5', '5'],
      };

      await service.create(dto as any);
      expect(prisma.subscriptionPlan.create).toHaveBeenCalledTimes(2);
    });

    it('should call handlePrismaError when create throws a known Prisma error', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.subscriptionPlan.create.mockRejectedValue(prismaError);

      const dto = {
        name: ['Duplicate Plan'],
        description: ['desc'],
        price: ['100'],
        channel_id: ['5'],
      };

      await expect(service.create(dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all subscription plans', async () => {
      prisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan]);

      const result = await service.findAll();
      expect(result).toEqual([mockPlan]);
    });
  });

  describe('findOne', () => {
    it('should return plan by id', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);

      const result = await service.findOne(1);
      expect(result).toEqual(mockPlan);
    });
  });

  describe('getMaterialsInSubPlan', () => {
    it('should return materials for subscription plan', async () => {
      const materials = [{ id: 1, subscriptionPlan_id: 1, material_id: 5 }];
      prisma.materialInSubscriptionPlan.findMany.mockResolvedValue(materials);

      const result = await service.getMaterialsInSubPlan(1);
      expect(result).toEqual(materials);
    });

    it('should throw ForbiddenException when DB query fails', async () => {
      prisma.materialInSubscriptionPlan.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.getMaterialsInSubPlan(1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findForChannel', () => {
    it('should return plans for a channel', async () => {
      prisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan]);

      const result = await service.findForChannel(5);
      expect(result).toEqual([mockPlan]);
    });
  });

  describe('findForSeller', () => {
    it('should return plans grouped by seller channels', async () => {
      const channels = [{ id: 5 }, { id: 6 }];
      prisma.channel.findMany.mockResolvedValue(channels);
      prisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan]);

      const result = await service.findForSeller(10);
      expect(result).toHaveLength(2);
      expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when seller has no channels', async () => {
      prisma.channel.findMany.mockResolvedValue([]);
      const result = await service.findForSeller(99);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update existing subscription plan', async () => {
      const updatedPlan = { ...mockPlan, name: 'Updated Plan' };
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.subscriptionPlan.update.mockResolvedValue(updatedPlan);

      const dto = {
        name: 'Updated Plan',
        description: 'Updated desc',
        price: '150',
        channel_id: '5',
      };

      const result = await service.update(1, dto as any);
      expect(result).toEqual(updatedPlan);
    });

    it('should throw ForbiddenException if plan does not exist for update', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle PrismaClientKnownRequestError during update', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.subscriptionPlan.update.mockRejectedValue(prismaError);

      await expect(service.update(1, { name: 'X' } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete existing plan with no materials', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.subscriptionPlan.delete.mockResolvedValue(mockPlan);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Subscription Plan deleted successfully',
      });
    });

    it('should return "has files" message if plan has materials', async () => {
      const planWithMaterials = {
        ...mockPlan,
        material_in_subscription_plan: null,
      };
      prisma.subscriptionPlan.findUnique.mockResolvedValue(planWithMaterials);

      const result = await service.remove(1);
      expect((result as any).message).toContain('files inside');
    });

    it('should throw ForbiddenException if plan does not exist', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when delete DB call fails', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.subscriptionPlan.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.remove(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
