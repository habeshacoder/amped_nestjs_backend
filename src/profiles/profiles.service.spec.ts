import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: {
    profile: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = { id: 'user-1' } as User;
  const mockProfile = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    user_id: 'user-1',
  };

  beforeEach(async () => {
    prisma = {
      profile: {
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
        ProfilesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all profiles', async () => {
      prisma.profile.findMany.mockResolvedValue([mockProfile]);

      const result = await service.findAll();
      expect(result).toEqual([mockProfile]);
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      prisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findOne(1);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('findMe', () => {
    it('should return current user profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);

      const result = await service.findMe(mockUser);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('findProfileByUserId', () => {
    it('should return profile by user id', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);

      const result = await service.findProfileByUserId('user-1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.profile.update.mockResolvedValue({ ...mockProfile, first_name: 'Jane' });

      const result = await service.updateProfile(1, { first_name: 'Jane' } as any);
      expect(result.first_name).toBe('Jane');
    });

    it('should throw ForbiddenException if profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { first_name: 'Jane' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
