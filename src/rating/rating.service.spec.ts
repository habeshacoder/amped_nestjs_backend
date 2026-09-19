import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('RatingService', () => {
  let service: RatingService;
  let prisma: {
    rate: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = { id: 'user-1' } as User;
  const mockRate = {
    id: 1,
    user_id: 'user-1',
    rating: 5,
    remark: 'Excellent',
    material_id: 10,
    channel_id: null,
  };

  beforeEach(async () => {
    prisma = {
      rate: {
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
        RatingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create rating successfully for material', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);
      prisma.rate.create.mockResolvedValue(mockRate);

      const dto = {
        rating: 5,
        remark: 'Great',
        material_id: 10,
        channel_id: undefined,
      };

      const result = await service.create(dto as any, mockUser);
      expect(result).toEqual(mockRate);
    });

    it('should throw ForbiddenException if user already rated', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);

      const dto = {
        rating: 5,
        remark: 'Great',
        material_id: 10,
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if both material_id and channel_id are missing or present', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);

      const dto = {
        rating: 5,
        remark: 'Great',
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all ratings', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);

      const result = await service.findAll();
      expect(result).toEqual([mockRate]);
    });
  });

  describe('findOne', () => {
    it('should return a single rating by id', async () => {
      prisma.rate.findUnique.mockResolvedValue(mockRate);

      const result = await service.findOne(1);
      expect(result).toEqual(mockRate);
    });
  });

  describe('materialRating', () => {
    it('should return ratings for a specific material', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);

      const result = await service.materialRating(10);
      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('rating');
    });
  });

  describe('remove', () => {
    it('should delete rating if found', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);
      prisma.rate.delete.mockResolvedValue(mockRate);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Rate deleted successfully' });
    });

    it('should throw ForbiddenException if rating not found', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });
  });
});
