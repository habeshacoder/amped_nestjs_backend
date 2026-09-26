import { Test, TestingModule } from '@nestjs/testing';
import { SocialLinksProfileService } from './social-links-profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('SocialLinksProfileService', () => {
  let service: SocialLinksProfileService;
  let prisma: {
    socialLinksProfile: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockLink = {
    id: 1,
    link: 'https://twitter.com/example',
    sellerProfile_id: 10,
  };

  beforeEach(async () => {
    prisma = {
      socialLinksProfile: {
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
        SocialLinksProfileService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SocialLinksProfileService>(SocialLinksProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create social link successfully', async () => {
      prisma.socialLinksProfile.create.mockResolvedValue(mockLink);

      const dto = {
        link: 'https://twitter.com/example',
        sellerProfile_id: 10,
      };

      const result = await service.create(dto as any);
      expect(result).toEqual(mockLink);
    });

    it('should return default string when create returns falsy', async () => {
      prisma.socialLinksProfile.create.mockResolvedValue(null as any);

      const dto = { link: 'https://instagram.com/x', sellerProfile_id: 10 };
      const result = await service.create(dto as any);
      expect(result).toBe('This action adds a new socialLinksProfile');
    });

    it('should throw ForbiddenException (P2002) when unique constraint violated', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.socialLinksProfile.create.mockRejectedValue(prismaError);

      await expect(
        service.create({ link: 'https://x.com', sellerProfile_id: 10 } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw generic ForbiddenException on unexpected DB error', async () => {
      prisma.socialLinksProfile.create.mockRejectedValue(
        new Error('DB unreachable'),
      );

      await expect(
        service.create({ link: 'https://x.com', sellerProfile_id: 10 } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all social links', async () => {
      prisma.socialLinksProfile.findMany.mockResolvedValue([mockLink]);

      const result = await service.findAll();
      expect(result).toEqual([mockLink]);
    });
  });

  describe('findOne', () => {
    it('should return social link by id', async () => {
      prisma.socialLinksProfile.findUnique.mockResolvedValue(mockLink);

      const result = await service.findOne(1);
      expect(result).toEqual(mockLink);
    });

    it('should return null when social link not found', async () => {
      prisma.socialLinksProfile.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('getSellerSocialLinks', () => {
    it('should return social links for seller', async () => {
      prisma.socialLinksProfile.findMany.mockResolvedValue([mockLink]);

      const result = await service.getSellerSocialLinks(10);
      expect(result).toEqual([mockLink]);
    });

    it('should return empty array for seller with no links', async () => {
      prisma.socialLinksProfile.findMany.mockResolvedValue([]);

      const result = await service.getSellerSocialLinks(999);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update social link successfully', async () => {
      const updated = { ...mockLink, link: 'https://linkedin.com/example' };
      prisma.socialLinksProfile.update.mockResolvedValue(updated);

      const result = await service.update(1, {
        link: 'https://linkedin.com/example',
        sellerProfile_id: 10,
      } as any);
      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenException (P2002) on unique conflict during update', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.socialLinksProfile.update.mockRejectedValue(prismaError);

      await expect(
        service.update(1, {
          link: 'https://x.com',
          sellerProfile_id: 10,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw generic ForbiddenException on update failure', async () => {
      prisma.socialLinksProfile.update.mockRejectedValue(new Error('DB error'));

      await expect(
        service.update(1, {
          link: 'https://x.com',
          sellerProfile_id: 10,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete social link if found', async () => {
      prisma.socialLinksProfile.delete.mockResolvedValue(mockLink);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Social link deleted successfully' });
    });

    it('should throw ForbiddenException when delete fails', async () => {
      prisma.socialLinksProfile.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.remove(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
