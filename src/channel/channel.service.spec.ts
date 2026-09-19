import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('ChannelService', () => {
  let service: ChannelService;
  let prisma: {
    channel: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
    channelImage: {
      create: jest.Mock;
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
        create: jest.fn(),
      },
      channelImage: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
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
    it('should return a channel by id', async () => {
      prisma.channel.findUnique.mockResolvedValue(mockChannel);

      const result = await service.findOne(1);
      expect(result).toEqual(mockChannel);
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

  describe('findForSeller', () => {
    it('should return published channels for a seller', async () => {
      prisma.channel.findMany.mockResolvedValue([mockChannel]);

      const result = await service.findForSeller(1);
      expect(result).toEqual([mockChannel]);
      expect(prisma.channel.findMany).toHaveBeenCalledWith({
        where: {
          sellerProfile_id: 1,
          draft: false,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('findDraftForSeller', () => {
    it('should return draft channels for a seller', async () => {
      prisma.channel.findMany.mockResolvedValue([mockChannel]);

      const result = await service.findDraftForSeller(1);
      expect(result).toEqual([mockChannel]);
      expect(prisma.channel.findMany).toHaveBeenCalledWith({
        where: {
          sellerProfile_id: 1,
          draft: true,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getMyChannels', () => {
    it('should return seller channels', async () => {
      prisma.channel.findMany.mockResolvedValue([mockChannel]);

      const result = await service.getMyChannels(1);
      expect(result).toEqual([mockChannel]);
    });
  });
});
