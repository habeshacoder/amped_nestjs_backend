import { Test, TestingModule } from '@nestjs/testing';
import { SocialLinksChannelService } from './social-links-channel.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('SocialLinksChannelService', () => {
  let service: SocialLinksChannelService;
  let prisma: {
    socialLinksChannel: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockSocialLink = {
    id: 1,
    link: 'https://youtube.com/@channel',
    channel_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      socialLinksChannel: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialLinksChannelService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<SocialLinksChannelService>(SocialLinksChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new social link for a channel', async () => {
      prisma.socialLinksChannel.create.mockResolvedValue(mockSocialLink);

      const result = await service.create({
        link: 'https://youtube.com/@channel',
        channel_id: 10,
      });

      expect(prisma.socialLinksChannel.create).toHaveBeenCalledWith({
        data: {
          link: 'https://youtube.com/@channel',
          channel_id: 10,
        },
      });
      expect(result).toEqual(mockSocialLink);
    });

    it('should throw ForbiddenException if duplicate key error occurs', async () => {
      const error = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.socialLinksChannel.create.mockRejectedValue(error);

      await expect(
        service.create({
          link: 'https://youtube.com/@channel',
          channel_id: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all social links', async () => {
      prisma.socialLinksChannel.findMany.mockResolvedValue([mockSocialLink]);

      const result = await service.findAll();
      expect(result).toEqual([mockSocialLink]);
      expect(prisma.socialLinksChannel.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a specific social link by id', async () => {
      prisma.socialLinksChannel.findUnique.mockResolvedValue(mockSocialLink);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSocialLink);
      expect(prisma.socialLinksChannel.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('findForChannel', () => {
    it('should return all social links for a specific channel', async () => {
      prisma.socialLinksChannel.findMany.mockResolvedValue([mockSocialLink]);

      const result = await service.findForChannel(10);
      expect(result).toEqual([mockSocialLink]);
      expect(prisma.socialLinksChannel.findMany).toHaveBeenCalledWith({
        where: { channel_id: 10 },
      });
    });
  });

  describe('update', () => {
    it('should update an existing social link', async () => {
      const updatedLink = {
        ...mockSocialLink,
        link: 'https://telegram.me/channel',
      };
      prisma.socialLinksChannel.update.mockResolvedValue(updatedLink);

      const result = await service.update(1, {
        link: 'https://telegram.me/channel',
        channel_id: 10,
      });

      expect(result).toEqual(updatedLink);
      expect(prisma.socialLinksChannel.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { link: 'https://telegram.me/channel' },
      });
    });

    it('should throw ForbiddenException when update encounters P2002', async () => {
      const error = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.socialLinksChannel.update.mockRejectedValue(error);

      await expect(
        service.update(1, {
          link: 'https://telegram.me/channel',
          channel_id: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a social link and return success message', async () => {
      prisma.socialLinksChannel.delete.mockResolvedValue(mockSocialLink);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Social link deleted successfully' });
      expect(prisma.socialLinksChannel.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw ForbiddenException if delete fails', async () => {
      prisma.socialLinksChannel.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.remove(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
