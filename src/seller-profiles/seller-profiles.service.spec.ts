import { Test, TestingModule } from '@nestjs/testing';
import { SellerProfilesService } from './seller-profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('SellerProfilesService', () => {
  let service: SellerProfilesService;
  let prisma: {
    sellerProfile: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = { id: 'user-1' } as User;
  const mockSellerProfile = {
    id: 1,
    name: 'Seller Studio',
    description: 'Educational books',
    user_id: 'user-1',
  };

  beforeEach(async () => {
    prisma = {
      sellerProfile: {
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
        SellerProfilesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerProfilesService>(SellerProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all seller profiles', async () => {
      prisma.sellerProfile.findMany.mockResolvedValue([mockSellerProfile]);

      const result = await service.findAll();
      expect(result).toEqual([mockSellerProfile]);
    });
  });

  describe('findOne', () => {
    it('should return a seller profile by id', async () => {
      prisma.sellerProfile.findUnique.mockResolvedValue(mockSellerProfile);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSellerProfile);
    });
  });

  describe('findMe', () => {
    it('should return seller profile for the current user', async () => {
      prisma.sellerProfile.findMany.mockResolvedValue([mockSellerProfile]);

      const result = await service.findMe(mockUser);
      expect(result).toEqual([mockSellerProfile]);
    });
  });

  describe('updateProfileInfo', () => {
    it('should update seller profile successfully', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(mockSellerProfile);
      prisma.sellerProfile.update.mockResolvedValue({
        ...mockSellerProfile,
        name: 'Updated Studio',
      });

      const result = await service.updateProfileInfo(1, {
        name: 'Updated Studio',
      } as any);
      expect(result.name).toBe('Updated Studio');
    });

    it('should throw ForbiddenException if seller profile not found', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfileInfo(999, { name: 'Updated Studio' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
