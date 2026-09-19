import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteService } from './favorite.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let prisma: {
    favorite: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = { id: 'user-1' } as User;
  const mockFavorite = {
    id: 1,
    user_id: 'user-1',
    material_id: 10,
    channel_id: null,
  };

  beforeEach(async () => {
    prisma = {
      favorite: {
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
        FavoriteService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create favorite if not already added', async () => {
      prisma.favorite.findFirst.mockResolvedValue(null);
      prisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await service.create(
        { material_id: 10, channel_id: null } as any,
        mockUser,
      );
      expect(result).toEqual(mockFavorite);
    });

    it('should return message if material already added in favorite', async () => {
      prisma.favorite.findFirst.mockResolvedValue(mockFavorite);

      const result = await service.create(
        { material_id: 10, channel_id: null } as any,
        mockUser,
      );
      expect(result).toEqual({ message: 'Material already added in Favorite' });
    });
  });

  describe('findAll', () => {
    it('should return all favorites', async () => {
      prisma.favorite.findMany.mockResolvedValue([mockFavorite]);

      const result = await service.findAll();
      expect(result).toEqual([mockFavorite]);
    });
  });

  describe('findOne', () => {
    it('should return a single favorite by id', async () => {
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);

      const result = await service.findOne(1);
      expect(result).toEqual(mockFavorite);
    });
  });

  describe('findForUser', () => {
    it('should return favorites for a specific user', async () => {
      prisma.favorite.findMany.mockResolvedValue([mockFavorite]);

      const result = await service.findForUser('user-1');
      expect(result).toEqual([mockFavorite]);
    });
  });

  describe('update', () => {
    it('should update favorite if found', async () => {
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      prisma.favorite.update.mockResolvedValue({
        ...mockFavorite,
        material_id: 20,
      });

      const result = await service.update(1, {
        material_id: 20,
        channel_id: null,
      } as any);
      expect(result.material_id).toBe(20);
    });

    it('should throw ForbiddenException if favorite to update does not exist', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, { material_id: 20, channel_id: null } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete favorite if found', async () => {
      prisma.favorite.findFirst.mockResolvedValue(mockFavorite);
      prisma.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Favourite deleted successfully' });
    });

    it('should throw ForbiddenException if favorite to delete not found', async () => {
      prisma.favorite.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });
  });
});
