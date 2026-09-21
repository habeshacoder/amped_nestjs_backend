import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../common/exceptions/domain-exceptions';

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
    channel_id: null as number | null,
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
      providers: [RatingService, { provide: PrismaService, useValue: prisma }],
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
        channel_id: undefined as number | undefined,
      };

      const result = await service.create(dto as any, mockUser);
      expect(result).toEqual(mockRate);
    });

    it('should throw ConflictError if user already rated', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);

      const dto = {
        rating: 5,
        remark: 'Great',
        material_id: 10,
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(
        ConflictError,
      );
    });

    it('should throw ValidationError if both material_id and channel_id are missing or present', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);

      const dto = {
        rating: 5,
        remark: 'Great',
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ConflictError on Prisma P2002 error', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.rate.create.mockRejectedValue(p2002);

      const dto = {
        rating: 5,
        remark: 'Great',
        material_id: 10,
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(
        ConflictError,
      );
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

  describe('getMyReview', () => {
    it('should return reviews for current user', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);
      const result = await service.getMyReview(mockUser);
      expect(result).toEqual([mockRate]);
    });

    it('should return message when no reviews found', async () => {
      prisma.rate.findMany.mockResolvedValue(null);
      const result = await service.getMyReview(mockUser);
      expect(result).toEqual({ message: 'No review found.' });
    });
  });

  describe('getByRatingNo', () => {
    it('should return ratings matching number', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);
      const result = await service.getByRatingNo(mockUser, 5);
      expect(result).toEqual([mockRate]);
    });

    it('should return message when no reviews found for rating', async () => {
      prisma.rate.findMany.mockResolvedValue(null);
      const result = await service.getByRatingNo(mockUser, 5);
      expect(result).toEqual({ message: 'No review found.' });
    });
  });

  describe('getMyMaterialReview', () => {
    it('should return user review for material', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);
      const result = await service.getMyMaterialReview(10, mockUser);
      expect(result).toEqual(mockRate);
    });

    it('should return false if no review found', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);
      const result = await service.getMyMaterialReview(10, mockUser);
      expect(result).toBe(false);
    });
  });

  describe('getMyChannelReview', () => {
    it('should return user review for channel', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);
      const result = await service.getMyChannelReview(20, mockUser);
      expect(result).toEqual(mockRate);
    });

    it('should return false if channel review not found', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);
      const result = await service.getMyChannelReview(20, mockUser);
      expect(result).toBe(false);
    });

    it('should return false if channel_id is invalid', async () => {
      expect(await service.getMyChannelReview(NaN, mockUser)).toBe(false);
    });
  });

  describe('materialRating', () => {
    it('should return ratings for a specific material', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);

      const result = await service.materialRating(10);
      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('rating');
    });

    it('should return default rating if empty', async () => {
      prisma.rate.findMany.mockResolvedValue([]);
      const result = await service.materialRating(10);
      expect(result).toBe(0);
    });

    it('should handle Prisma P2002 error in materialRating', async () => {
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.rate.findMany.mockRejectedValue(p2002);

      await expect(service.materialRating(10)).rejects.toThrow(ConflictError);
    });
  });

  describe('channelRating', () => {
    it('should return ratings for a specific channel', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);

      const result = await service.channelRating(10);
      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('rating');
    });

    it('should return default rating if empty', async () => {
      prisma.rate.findMany.mockResolvedValue([]);
      const result = await service.channelRating(10);
      expect(result).toBe(0);
    });

    it('should return 0 if channel_id is null', async () => {
      const result = await service.channelRating(null as any);
      expect(result).toBe(0);
    });
  });

  describe('noOfMaterialRating', () => {
    it('should return count of ratings for material', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate, mockRate]);
      const result = await service.noOfMaterialRating({
        rating: 5,
        material_id: 10,
      });
      expect(result).toBe(2);
    });
  });

  describe('noOfChannelRating', () => {
    it('should return count of ratings for channel', async () => {
      prisma.rate.findMany.mockResolvedValue([mockRate]);
      const result = await service.noOfChannelRating({
        rating: 5,
        channel_id: 20,
      });
      expect(result).toBe(1);
    });
  });

  describe('update', () => {
    it('should update rating successfully', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);
      prisma.rate.update.mockResolvedValue({ ...mockRate, rating: 4 });

      const result = await service.update(1, { rating: 4, remark: 'Updated' });
      expect(result).toEqual({ ...mockRate, rating: 4 });
    });

    it('should throw NotFoundError if rating to update not found', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, { rating: 4, remark: 'Updated' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('should delete rating if found', async () => {
      prisma.rate.findFirst.mockResolvedValue(mockRate);
      prisma.rate.delete.mockResolvedValue(mockRate);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Rate deleted successfully' });
    });

    it('should throw NotFoundError if rating not found', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
