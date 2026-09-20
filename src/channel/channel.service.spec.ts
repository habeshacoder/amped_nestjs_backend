import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { ChannelQueryService } from './channel-query.service';
import { ChannelCommandService } from './channel-command.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';

describe('ChannelService', () => {
  let service: ChannelService;
  let queryService: ChannelQueryService;
  let commandService: ChannelCommandService;

  const mockChannel = {
    id: 1,
    name: 'Tech Channel',
    description: 'Tech tutorials',
    sellerProfile_id: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        ChannelQueryService,
        ChannelCommandService,
        FileStorageService,
        {
          provide: PrismaService,
          useValue: {
            channel: {
              findMany: jest.fn().mockResolvedValue([mockChannel]),
              findUnique: jest.fn().mockResolvedValue(mockChannel),
              count: jest.fn().mockResolvedValue(10),
              create: jest.fn().mockResolvedValue(mockChannel),
              update: jest.fn().mockResolvedValue(mockChannel),
              delete: jest.fn().mockResolvedValue(mockChannel),
            },
            channelImage: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            previewChannel: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
    queryService = module.get<ChannelQueryService>(ChannelQueryService);
    commandService = module.get<ChannelCommandService>(ChannelCommandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to queryService.findAll', async () => {
      const spy = jest
        .spyOn(queryService, 'findAll')
        .mockResolvedValue([mockChannel] as any);
      const result = await service.findAll();
      expect(result).toEqual([mockChannel]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('paginateChannels', () => {
    it('should delegate to queryService.paginateChannels', async () => {
      const mockResult = {
        Materials: [mockChannel],
        Meta: {
          Num_Of_Channels: 10,
          Num_Of_Pages: 2,
          Per_Page: 5,
          Channels_In_last_page: 5,
          self: 0,
          prev: null,
          next: 1,
          last: 1,
        },
      } as any;

      const spy = jest
        .spyOn(queryService, 'paginateChannels')
        .mockResolvedValue(mockResult);
      const result = await service.paginateChannels({ take: 5, page: 0 });
      expect(result).toEqual(mockResult);
      expect(spy).toHaveBeenCalledWith({ take: 5, page: 0 });
    });
  });

  describe('create', () => {
    it('should delegate to commandService.create', async () => {
      const spy = jest
        .spyOn(commandService, 'create')
        .mockResolvedValue(mockChannel as any);
      const files = { profile: [{ path: 'uploads/p.png' }] };
      const dto = {
        name: 'Tech',
        description: 'Desc',
        sellerProfile_id: '1',
      } as any;

      const result = await service.create(files, dto);
      expect(result).toEqual(mockChannel);
      expect(spy).toHaveBeenCalledWith(files, dto);
    });
  });

  describe('remove', () => {
    it('should delegate to commandService.remove', async () => {
      const spy = jest.spyOn(commandService, 'remove').mockResolvedValue({
        message: 'Channel Deleted Successfully',
      } as any);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Channel Deleted Successfully' });
      expect(spy).toHaveBeenCalledWith(1);
    });
  });
});
