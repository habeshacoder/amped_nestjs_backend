import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanService } from './subscription-plan.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('SubscriptionPlanService', () => {
  let service: SubscriptionPlanService;
  let prisma: {
    subscriptionPlan: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    channel: {
      update: jest.Mock;
    };
  };

  const mockPlan = {
    id: 1,
    name: 'Basic Plan',
    description: 'Basic access',
    price: 100,
    channel_id: 5,
    material_in_subscription_plan: [],
  };

  beforeEach(async () => {
    prisma = {
      subscriptionPlan: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      channel: {
        update: jest.fn(),
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

  describe('remove', () => {
    it('should delete existing plan', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
      prisma.subscriptionPlan.delete.mockResolvedValue(mockPlan);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Subscription Plan deleted successfully',
      });
    });

    it('should throw ForbiddenException if plan does not exist', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });
  });
});
