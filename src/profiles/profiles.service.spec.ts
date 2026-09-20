import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let fileStorage: FileStorageService;
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
        FileStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    fileStorage = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user profile with extracted media filenames', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      prisma.profile.create.mockResolvedValue(mockProfile);

      const files = {
        profile: [{ path: 'uploads/profile.png' }],
        cover: [{ path: 'uploads/cover.png' }],
      };

      const result = await service.create(
        files,
        { first_name: 'John', last_name: 'Doe' } as any,
        mockUser,
      );

      expect(result).toEqual(mockProfile);
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          first_name: 'John',
          last_name: 'Doe',
          profile_image: 'profile.png',
          cover_image: 'cover.png',
          user_id: 'user-1',
        }),
      });
    });

    it('should throw if user already has a profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);

      await expect(service.create({}, {} as any, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
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
      prisma.profile.update.mockResolvedValue({
        ...mockProfile,
        first_name: 'Jane',
      });

      const result = await service.updateProfile(1, {
        first_name: 'Jane',
      } as any);
      expect(result.first_name).toBe('Jane');
    });

    it('should throw ForbiddenException if profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { first_name: 'Jane' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProfileImage', () => {
    it('should update profile image and delete old image', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProfile,
        profile_image: 'old-pic.png',
      });
      prisma.profile.update.mockResolvedValue({
        ...mockProfile,
        profile_image: 'new-pic.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateProfileImage(
        { profile: [{ path: 'uploads/new-pic.png' }] },
        1,
      );

      expect(result).toEqual({
        message: 'Profile Image Uploaded Successfully',
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'profile/profile',
        'old-pic.png',
      );
    });
  });
});
