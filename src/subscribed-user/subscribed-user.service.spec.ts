import { Test, TestingModule } from '@nestjs/testing';
import { SubscribedUserService } from './subscribed-user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('SubscribedUserService', () => {
  let service: SubscribedUserService;
  let prisma: {
    subscribedUser: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
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
  });

  describe('findAll', () => {
    it('should return all subscribed users', async () => {
      prisma.subscribedUser.findMany.mockResolvedValue([mockSubscribedUser]);

      const result = await service.findAll();
      expect(result).toEqual([mockSubscribedUser]);
    });
  });

  describe('findOne', () => {
    it('should return a subscribed user by id', async () => {
      prisma.subscribedUser.findUnique.mockResolvedValue(mockSubscribedUser);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSubscribedUser);
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
  });
});
