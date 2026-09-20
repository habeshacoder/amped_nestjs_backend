import { Test, TestingModule } from '@nestjs/testing';
import { ChannelCommandService } from './channel-command.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { NotFoundError } from '../common/exceptions/domain-exceptions';

describe('ChannelCommandService', () => {
  let service: ChannelCommandService;
  let fileStorage: FileStorageService;
  let prisma: {
    channel: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    channelImage: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
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
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      channelImage: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelCommandService,
        FileStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelCommandService>(ChannelCommandService);
    fileStorage = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create channel and channel images with extracted file names', async () => {
      prisma.channel.create.mockResolvedValue(mockChannel);
      prisma.channelImage.create.mockResolvedValue({ id: 10 });

      const files = {
        profile: [{ path: 'uploads/channel/profile.jpg' }],
        cover: [{ path: 'uploads/channel/cover.jpg' }],
      };

      const result = await service.create(files, {
        name: 'Tech Channel',
        description: 'Tech tutorials',
        sellerProfile_id: '1',
      } as any);

      expect(result).toEqual(mockChannel);
      expect(prisma.channel.create).toHaveBeenCalledWith({
        data: {
          name: 'Tech Channel',
          description: 'Tech tutorials',
          sellerProfile_id: 1,
        },
      });
      expect(prisma.channelImage.create).toHaveBeenCalledWith({
        data: {
          image: 'profile.jpg',
          primary: true,
          channel_id: 1,
        },
      });
      expect(prisma.channelImage.create).toHaveBeenCalledWith({
        data: {
          image: 'cover.jpg',
          cover: true,
          channel_id: 1,
        },
      });
    });
  });

  describe('update', () => {
    it('should update channel successfully', async () => {
      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      prisma.channel.update.mockResolvedValue({
        ...mockChannel,
        name: 'Updated Tech',
      });

      const result = await service.update(1, {
        name: 'Updated Tech',
        description: 'New desc',
        sellerProfile_id: '1',
      } as any);

      expect(result.name).toBe('Updated Tech');
    });

    it('should throw NotFoundError if channel not found', async () => {
      prisma.channel.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, {
          name: 'Updated Tech',
          description: 'New desc',
          sellerProfile_id: '1',
        } as any),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateChannelProfileImage', () => {
    it('should update channel profile image and delete previous image', async () => {
      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      prisma.channelImage.findFirst.mockResolvedValue({
        id: 10,
        image: 'old.png',
      });
      prisma.channelImage.update.mockResolvedValue({
        id: 10,
        image: 'new.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateChannelProfileImage(
        { profile: [{ path: 'uploads/new.png' }] },
        1,
      );

      expect(result).toEqual({
        message: 'Channel Profile Image Uploaded Successfully',
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith('channel', 'old.png');
    });
  });

  describe('remove', () => {
    it('should delete channel and delete associated media files', async () => {
      prisma.channel.findFirst.mockResolvedValue({
        ...mockChannel,
        channel_image: [{ image: 'avatar.png' }],
        channel_preview: [{ preview: 'clip.mp3' }],
      });
      prisma.channel.delete.mockResolvedValue(mockChannel);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Channel Deleted Successfully' });
      expect(prisma.channel.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'channel',
        'avatar.png',
      );
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'channel',
        'clip.mp3',
      );
    });
  });
});
