import { Test, TestingModule } from '@nestjs/testing';
import { SubscribedUserService } from './subscribed-user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('SubscribedUserService', () => {
  let service: SubscribedUserService;
  let prisma: {
    subscribedUser: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = { id: 'user-1' } as User;
  const mockSubscribedUser = {
    id: 1,
    user_id: 'user-1',
    subscription_id: 5,
  };

  beforeEach(async () => {
    prisma = {
      subscribedUser: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribedUserService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubscribedUserService>(SubscribedUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create subscribed user if not already subscribed', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(null);
      prisma.subscribedUser.create.mockResolvedValue(mockSubscribedUser);

      const result = await service.create(
        { subscription_id: 5 } as any,
        mockUser,
      );
      expect(result).toEqual(mockSubscribedUser);
    });

    it('should throw ForbiddenException if user already subscribed', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(mockSubscribedUser);

      await expect(
        service.create({ subscription_id: 5 } as any, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle PrismaClientKnownRequestError P2002 during create', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(null);
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.subscribedUser.create.mockRejectedValue(prismaError);

      await expect(
        service.create({ subscription_id: 5 } as any, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle generic error during create', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(null);
      prisma.subscribedUser.create.mockRejectedValue(new Error('DB down'));

      await expect(
        service.create({ subscription_id: 5 } as any, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all subscribed users', async () => {
      prisma.subscribedUser.findMany.mockResolvedValue([mockSubscribedUser]);

      const result = await service.findAll();
      expect(result).toEqual([mockSubscribedUser]);
    });

    it('should return no-user message when result is falsy', async () => {
      // Simulates a DB returning null/undefined — unlikely but tests the else branch
      prisma.subscribedUser.findMany.mockResolvedValue(null as any);

      const result = await service.findAll();
      expect((result as any).message).toContain('No subscribed user');
    });
  });

  describe('findOne', () => {
    it('should return a subscribed user by id', async () => {
      prisma.subscribedUser.findUnique.mockResolvedValue(mockSubscribedUser);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSubscribedUser);
    });

    it('should return no-user message when not found', async () => {
      prisma.subscribedUser.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect((result as any).message).toContain('No subscribed user');
    });
  });

  describe('update', () => {
    it('should update subscribed user if found', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(mockSubscribedUser);
      prisma.subscribedUser.update.mockResolvedValue({
        ...mockSubscribedUser,
        subscription_id: 10,
      });

      const result = await service.update(1, { subscription_id: 10 } as any);
      expect(result).toHaveProperty('subscription_id', 10);
    });

    it('should throw ForbiddenException if user not found for update', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, { subscription_id: 10 } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle error thrown during update', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(mockSubscribedUser);
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.subscribedUser.update.mockRejectedValue(prismaError);

      await expect(
        service.update(1, { subscription_id: 10 } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if update returns falsy', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(mockSubscribedUser);
      prisma.subscribedUser.update.mockResolvedValue(null as any);

      await expect(
        service.update(1, { subscription_id: 10 } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete subscribed user if found', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(mockSubscribedUser);
      prisma.subscribedUser.delete.mockResolvedValue(mockSubscribedUser);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Subscribed User deleted successfully',
      });
    });

    it('should throw ForbiddenException if subscribed user not found', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if delete DB call throws', async () => {
      prisma.subscribedUser.findFirst.mockResolvedValue(mockSubscribedUser);
      prisma.subscribedUser.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.remove(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
