import { Test, TestingModule } from '@nestjs/testing';
import { ChannelQueryService } from './channel-query.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { Response } from 'express';

describe('ChannelQueryService', () => {
  let service: ChannelQueryService;
  let prisma: {
    channel: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
    channelImage: {
      findFirst: jest.Mock;
    };
    previewChannel: {
      findFirst: jest.Mock;
    };
  };

  const mockChannel = {
    id: 1,
    name: 'Tech Channel',
    description: 'Tech tutorials',
    sellerProfile_id: 1,
  };

  beforeEach(async () => {
    prisma = {
      channel: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      channelImage: {
        findFirst: jest.fn(),
      },
      previewChannel: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelQueryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelQueryService>(ChannelQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all channels', async () => {
      prisma.channel.findMany.mockResolvedValue([mockChannel]);

      const result = await service.findAll();
      expect(result).toEqual([mockChannel]);
      expect(prisma.channel.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return channel by id', async () => {
      prisma.channel.findUnique.mockResolvedValue(mockChannel);

      const result = await service.findOne(1);
      expect(result).toEqual(mockChannel);
    });

    it('should throw ForbiddenException if id is invalid', async () => {
      await expect(service.findOne(NaN)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('paginateChannels', () => {
    it('should return paginated channels and meta', async () => {
      prisma.channel.count.mockResolvedValue(10);
      prisma.channel.findMany.mockResolvedValue([mockChannel]);

      const result = await service.paginateChannels({ take: 5, page: 0 });
      expect(result).toHaveProperty('Materials');
      expect(result).toHaveProperty('Meta');
      expect(result.Meta.Num_Of_Channels).toBe(10);
      expect(result.Meta.Num_Of_Pages).toBe(2);
    });

    it('should throw ForbiddenException if page is out of bounds', async () => {
      prisma.channel.count.mockResolvedValue(10);

      await expect(
        service.paginateChannels({ take: 5, page: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('showChannelProfile', () => {
    it('should throw if channel profile image not found', async () => {
      prisma.channelImage.findFirst.mockResolvedValue(null);
      const res = { sendFile: jest.fn() } as unknown as Response;

      await expect(service.showChannelProfile(1, res)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should send file when profile image exists', async () => {
      prisma.channelImage.findFirst.mockResolvedValue({
        id: 1,
        image: 'avatar.jpg',
      });
      const res = { sendFile: jest.fn() } as unknown as Response;

      await service.showChannelProfile(1, res);
      expect(res.sendFile).toHaveBeenCalledWith(
        expect.stringContaining('avatar.jpg'),
      );
    });
  });
});
