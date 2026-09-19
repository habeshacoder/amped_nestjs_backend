import { Test, TestingModule } from '@nestjs/testing';
import { SocialLinksProfileService } from './social-links-profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('SocialLinksProfileService', () => {
  let service: SocialLinksProfileService;
  let prisma: {
    socialLinksProfile: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
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
  });

  describe('findAll', () => {
    it('should return all social links', async () => {
      prisma.socialLinksProfile.findMany.mockResolvedValue([mockLink]);

      const result = await service.findAll();
      expect(result).toEqual([mockLink]);
    });
  });

  describe('getSellerSocialLinks', () => {
    it('should return social links for seller', async () => {
      prisma.socialLinksProfile.findMany.mockResolvedValue([mockLink]);

      const result = await service.getSellerSocialLinks(10);
      expect(result).toEqual([mockLink]);
    });
  });

  describe('remove', () => {
    it('should delete social link if found', async () => {
      prisma.socialLinksProfile.findFirst.mockResolvedValue(mockLink);
      prisma.socialLinksProfile.delete.mockResolvedValue(mockLink);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Social link deleted successfully' });
    });

    it('should throw ForbiddenException if link not found', async () => {
      prisma.socialLinksProfile.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });
  });
});
