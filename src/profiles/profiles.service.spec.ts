import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../common/exceptions/domain-exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';
import * as argon from 'argon2';

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
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
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
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
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
      prisma.profile.create.mockResolvedValue({
        id: 1,
        first_name: 'John',
      });

      const images = {
        profile: [{ path: 'uploads/profile.png' }],
        cover: [{ path: 'uploads/cover.png' }],
      };

      const result = await service.create(
        images,
        { first_name: 'John', last_name: 'Doe' } as any,
        mockUser,
      );

      expect(result).toEqual({ id: 1, first_name: 'John' });
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          first_name: 'John',
          profile_image: 'profile.png',
          cover_image: 'cover.png',
          user_id: 'user-1',
        }),
      });
    });

    it('should throw ConflictError if user already has a profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);

      await expect(service.create({}, {} as any, mockUser)).rejects.toThrow(
        ConflictError,
      );
    });

    it('should throw ConflictError on P2002 Prisma error', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      const p2002 = new PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      prisma.profile.create.mockRejectedValue(p2002);

      await expect(service.create({}, {} as any, mockUser)).rejects.toThrow(
        ConflictError,
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

    it('should throw NotFoundError if profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { first_name: 'Jane' } as any),
      ).rejects.toThrow(NotFoundError);
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

    it('should throw NotFoundError if profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfileImage({ profile: [] }, 999),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateCoverImage', () => {
    it('should throw NotFoundError if profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCoverImage({ cover: [] }, 999),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update cover image and delete old cover', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProfile,
        cover_image: 'old-cover.png',
      });
      prisma.profile.update.mockResolvedValue({
        ...mockProfile,
        cover_image: 'new-cover.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateCoverImage(
        { cover: [{ path: 'uploads/new-cover.png' }] },
        1,
      );

      expect(result).toEqual({ message: 'Cover Image Uploaded Successfully' });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'profile/profile',
        'old-cover.png',
      );
    });
  });

  describe('updatePassword', () => {
    it('should throw NotFoundError if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword(
          {
            oldPassword: 'old',
            newPassword: 'new',
            newPasswordConfirm: 'new',
          } as any,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if old password does not match', async () => {
      const hashedPw = await argon.hash('correctPassword');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        password: hashedPw,
      });

      await expect(
        service.updatePassword(
          {
            oldPassword: 'wrongPassword',
            newPassword: 'newPassword123',
            newPasswordConfirm: 'newPassword123',
          } as any,
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError if newPassword and newPasswordConfirm mismatch', async () => {
      const hashedPw = await argon.hash('correctPassword');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        password: hashedPw,
      });

      await expect(
        service.updatePassword(
          {
            oldPassword: 'correctPassword',
            newPassword: 'newPassword123',
            newPasswordConfirm: 'differentPassword',
          } as any,
          mockUser,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should update password successfully', async () => {
      const hashedPw = await argon.hash('correctPassword');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        password: hashedPw,
      });
      prisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.updatePassword(
        {
          oldPassword: 'correctPassword',
          newPassword: 'newPassword123',
          newPasswordConfirm: 'newPassword123',
        } as any,
        mockUser,
      );

      expect(result).toEqual({ message: 'Password Updated Successfully' });
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError if profile to remove not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundError);
    });

    it('should delete profile and clean up images', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProfile,
        profile_image: 'pic.png',
        cover_image: 'cover.png',
      });
      prisma.profile.delete.mockResolvedValue(mockProfile);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Profile deleted successfully' });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'profile/profile',
        'pic.png',
      );
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'profile/profile',
        'cover.png',
      );
    });
  });
});
