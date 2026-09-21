import { Test, TestingModule } from '@nestjs/testing';
import { ChannelCommandService } from './channel-command.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import {
  ConflictError,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
    previewChannel: {
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
      previewChannel: {
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

    it('should throw ConflictError on duplicate create (Prisma P2002)', async () => {
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.channel.create.mockRejectedValue(p2002);

      await expect(
        service.create({}, {
          name: 'Existing Channel',
          description: 'desc',
          sellerProfile_id: '1',
        } as any),
      ).rejects.toThrow(ConflictError);
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

      expect(result?.name).toBe('Updated Tech');
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

    it('should throw ConflictError on duplicate channel name update (Prisma P2002)', async () => {
      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.channel.update.mockRejectedValue(p2002);

      await expect(
        service.update(1, {
          name: 'Taken Channel',
          description: 'New desc',
          sellerProfile_id: '1',
        } as any),
      ).rejects.toThrow(ConflictError);
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

    it('should throw NotFoundError if channel not found when updating profile image', async () => {
      prisma.channel.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChannelProfileImage(
          { profile: [{ path: 'uploads/new.png' }] },
          999,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should create new channel image record if primary image does not exist yet', async () => {
      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      prisma.channelImage.findFirst.mockResolvedValue(null);
      prisma.channelImage.create.mockResolvedValue({ id: 11 });

      const result = await service.updateChannelProfileImage(
        { profile: [{ path: 'uploads/first.png' }] },
        1,
      );

      expect(result).toEqual({
        message: 'Channel Profile Image Uploaded Successfully',
      });
      expect(prisma.channelImage.create).toHaveBeenCalledWith({
        data: {
          image: 'first.png',
          primary: true,
          channel_id: 1,
        },
      });
    });
  });

  describe('updateChannelCoverImage', () => {
    it('should update channel cover image and delete previous cover', async () => {
      prisma.channel.findFirst.mockResolvedValue(mockChannel);
      prisma.channelImage.findFirst.mockResolvedValue({
        id: 10,
        image: 'old_cover.png',
      });
      prisma.channelImage.update.mockResolvedValue({
        id: 10,
        image: 'new_cover.png',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateChannelCoverImage(
        { cover: [{ path: 'uploads/new_cover.png' }] },
        1,
      );

      expect(result).toEqual({
        message: 'Channel Cover Image Uploaded Successfully',
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'channel',
        'old_cover.png',
      );
    });

    it('should throw NotFoundError if channel not found when updating cover image', async () => {
      prisma.channel.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChannelCoverImage(
          { cover: [{ path: 'uploads/new_cover.png' }] },
          999,
        ),
      ).rejects.toThrow(NotFoundError);
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

    it('should throw NotFoundError if channel not found for removal', async () => {
      prisma.channel.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('uploadChannelProfile', () => {
    it('should create primary channel image if not present', async () => {
      prisma.channelImage.findFirst.mockResolvedValue(null);
      prisma.channelImage.create.mockResolvedValue({
        id: 1,
        image: 'profile.jpg',
      });

      const file = { filename: 'profile.jpg' } as any;
      const result = await service.uploadChannelProfile(file, 1);
      expect(result).toEqual({ id: 1, image: 'profile.jpg' });
      expect(prisma.channelImage.create).toHaveBeenCalledWith({
        data: { image: 'profile.jpg', primary: true, channel_id: 1 },
      });
    });

    it('should update primary channel image and delete old file if present', async () => {
      prisma.channelImage.findFirst.mockResolvedValue({
        id: 1,
        image: 'old.jpg',
      });
      prisma.channelImage.update.mockResolvedValue({
        id: 1,
        image: 'new.jpg',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const file = { filename: 'new.jpg' } as any;
      const result = await service.uploadChannelProfile(file, 1);
      expect(result).toEqual({ id: 1, image: 'new.jpg' });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith('channel', 'old.jpg');
    });
  });

  describe('uploadChannelCover', () => {
    it('should create cover image if not present', async () => {
      prisma.channelImage.findFirst.mockResolvedValue(null);
      prisma.channelImage.create.mockResolvedValue({
        id: 2,
        image: 'cover.jpg',
      });

      const file = { filename: 'cover.jpg' } as any;
      const result = await service.uploadChannelCover(file, 1);
      expect(result).toEqual({ id: 2, image: 'cover.jpg' });
    });

    it('should update cover image if present', async () => {
      prisma.channelImage.findFirst.mockResolvedValue({
        id: 2,
        image: 'old_cover.jpg',
      });
      prisma.channelImage.update.mockResolvedValue({
        id: 2,
        image: 'new_cover.jpg',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const file = { filename: 'new_cover.jpg' } as any;
      const result = await service.uploadChannelCover(file, 1);
      expect(result).toEqual({ id: 2, image: 'new_cover.jpg' });
    });
  });

  describe('uploadChannelImage', () => {
    it('should upload multiple images and return records', async () => {
      prisma.channelImage.create.mockResolvedValue({
        id: 10,
        image: 'img1.png',
      });

      const files = [{ filename: 'img1.png' }] as any;
      const result = await service.uploadChannelImage(files, 1);
      expect(result).toHaveLength(1);
      expect(prisma.channelImage.create).toHaveBeenCalledWith({
        data: { image: 'img1.png', channel_id: 1 },
      });
    });
  });

  describe('uploadChannelPreview', () => {
    it('should create channel preview if not exists', async () => {
      prisma.previewChannel.findFirst.mockResolvedValue(null);
      prisma.previewChannel.create.mockResolvedValue({
        id: 5,
        preview: 'sample.mp3',
      });

      const file = { filename: 'sample.mp3' } as any;
      const result = await service.uploadChannelPreview(file, 1);
      expect(result).toEqual({ id: 5, preview: 'sample.mp3' });
    });

    it('should update channel preview and delete old file', async () => {
      prisma.previewChannel.findFirst.mockResolvedValue({
        id: 5,
        preview: 'old.mp3',
      });
      prisma.previewChannel.update.mockResolvedValue({
        id: 5,
        preview: 'new.mp3',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const file = { filename: 'new.mp3' } as any;
      const result = await service.uploadChannelPreview(file, 1);
      expect(result).toEqual({ id: 5, preview: 'new.mp3' });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith('channel', 'old.mp3');
    });
  });
});
