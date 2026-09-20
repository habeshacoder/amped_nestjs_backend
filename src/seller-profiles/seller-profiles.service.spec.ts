import { Test, TestingModule } from '@nestjs/testing';
import { SellerProfilesService } from './seller-profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../common/exceptions/domain-exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';

describe('SellerProfilesService', () => {
  let service: SellerProfilesService;
  let fileStorage: FileStorageService;
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
        FileStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerProfilesService>(SellerProfilesService);
    fileStorage = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create seller profile with extracted image filenames', async () => {
      prisma.sellerProfile.create.mockResolvedValue(mockSellerProfile);

      const files = {
        image: [{ path: 'uploads/avatar.png' }],
        cover: [{ path: 'uploads/cover.jpg' }],
      };

      const result = await service.create(
        files,
        { name: 'Studio', description: 'Desc' } as any,
        mockUser,
      );

      expect(result).toEqual(mockSellerProfile);
      expect(prisma.sellerProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Studio',
          image: 'avatar.png',
          cover_image: 'cover.jpg',
          user_id: 'user-1',
        }),
      });
    });

    it('should throw ConflictError on P2002 unique constraint violation', async () => {
      const p2002 = new PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      prisma.sellerProfile.create.mockRejectedValue(p2002);

      await expect(service.create({}, {} as any, mockUser)).rejects.toThrow(
        ConflictError,
      );
    });
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

    it('should throw ValidationError if id is invalid', async () => {
      await expect(service.findOne(NaN)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if seller profile is not found', async () => {
      prisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundError);
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

    it('should throw NotFoundError if seller profile not found', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfileInfo(999, { name: 'Updated Studio' } as any),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProfileImage', () => {
    it('should throw NotFoundError if seller profile not found', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfileImage({ image: [] }, 999),
      ).rejects.toThrow(NotFoundError);
    });

    it('should return success message if no image filename extracted', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(mockSellerProfile);

      const result = await service.updateProfileImage({}, 1);
      expect(result).toEqual({
        message: 'Profile Image Uploaded Successfully',
      });
    });

    it('should update image and delete old file', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue({
        ...mockSellerProfile,
        image: 'old-avatar.png',
      });
      prisma.sellerProfile.update.mockResolvedValue({
        ...mockSellerProfile,
        image: 'new-avatar.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateProfileImage(
        { image: [{ path: 'uploads/new-avatar.png' }] },
        1,
      );

      expect(result).toEqual({
        message: 'Profile Image Uploaded Successfully',
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'sellerProfile/image',
        'old-avatar.png',
      );
    });
  });

  describe('updateCoverImage', () => {
    it('should throw NotFoundError if seller profile not found', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCoverImage({ cover: [] }, 999),
      ).rejects.toThrow(NotFoundError);
    });

    it('should return success message if no cover filename extracted', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(mockSellerProfile);

      const result = await service.updateCoverImage({}, 1);
      expect(result).toEqual({
        message: 'Cover Image Uploaded Successfully',
      });
    });

    it('should update cover and delete old file', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue({
        ...mockSellerProfile,
        cover_image: 'old-cover.png',
      });
      prisma.sellerProfile.update.mockResolvedValue({
        ...mockSellerProfile,
        cover_image: 'new-cover.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateCoverImage(
        { cover: [{ path: 'uploads/new-cover.png' }] },
        1,
      );

      expect(result).toEqual({
        message: 'Cover Image Uploaded Successfully',
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'sellerProfile/image',
        'old-cover.png',
      );
    });
  });

  describe('uploadImage & uploadCover', () => {
    it('should throw NotFoundError if seller profile not found in uploadImage', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);
      await expect(
        service.uploadImage({ filename: 'img.png' } as any, 999),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if seller profile not found in uploadCover', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);
      await expect(
        service.uploadCover({ filename: 'cvr.png' } as any, 999),
      ).rejects.toThrow(NotFoundError);
    });

    it('should uploadImage and delete old file', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue({
        ...mockSellerProfile,
        image: 'old-pic.png',
      });
      prisma.sellerProfile.update.mockResolvedValue({
        ...mockSellerProfile,
        image: 'new-pic.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.uploadImage(
        { filename: 'new-pic.png' } as any,
        1,
      );
      expect(result.image).toBe('new-pic.png');
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'sellerProfile/image',
        'old-pic.png',
      );
    });

    it('should uploadCover and delete old file', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue({
        ...mockSellerProfile,
        cover_image: 'old-cover.png',
      });
      prisma.sellerProfile.update.mockResolvedValue({
        ...mockSellerProfile,
        cover_image: 'new-cover.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.uploadCover(
        { filename: 'new-cover.png' } as any,
        1,
      );
      expect(result.cover_image).toBe('new-cover.png');
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'sellerProfile/image',
        'old-cover.png',
      );
    });
  });

  describe('remove', () => {
    it('should delete seller profile successfully', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue({
        ...mockSellerProfile,
        image: 'avatar.png',
        cover_image: 'cover.png',
      });
      prisma.sellerProfile.delete.mockResolvedValue(mockSellerProfile);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Seller Profile deleted successfully',
      });
      expect(prisma.sellerProfile.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'sellerProfile/image',
        'avatar.png',
      );
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'sellerProfile/image',
        'cover.png',
      );
    });

    it('should throw NotFoundError if profile to delete is not found', async () => {
      prisma.sellerProfile.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
