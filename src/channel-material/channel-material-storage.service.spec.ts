import { Test, TestingModule } from '@nestjs/testing';
import { ChannelMaterialStorageService } from './channel-material-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { NotFoundError } from '../common/exceptions/domain-exceptions';
import { Response } from 'express';

describe('ChannelMaterialStorageService', () => {
  let service: ChannelMaterialStorageService;
  let fileStorage: FileStorageService;
  let prisma: {
    channelMaterial: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    channelMaterialImage: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    channelPreviewMaterial: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      channelMaterial: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      channelMaterialImage: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      channelPreviewMaterial: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelMaterialStorageService,
        FileStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelMaterialStorageService>(
      ChannelMaterialStorageService,
    );
    fileStorage = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFile', () => {
    it('should throw NotFoundError if channel material not found', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue(null);

      await expect(
        service.createFile({ material: [{ path: 'uploads/book.epub' }] }, 999),
      ).rejects.toThrow(NotFoundError);
    });

    it('should extract filenames and update channel material + related entities', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Channel Track',
      };
      prisma.channelMaterial.findFirst.mockResolvedValue(mockMaterial);
      prisma.channelMaterial.update.mockResolvedValue({
        ...mockMaterial,
        material: 'track.mp3',
      });
      prisma.channelMaterialImage.create.mockResolvedValue({ id: 10 });
      prisma.channelPreviewMaterial.create.mockResolvedValue({ id: 20 });

      const files = {
        material: [{ path: 'uploads/channel/track.mp3' }],
        profile: [{ path: 'uploads/channel/profile.png' }],
        cover: [{ path: 'uploads/channel/cover.jpg' }],
        preview: [{ path: 'uploads/channel/preview.mp3' }],
        images: [{ path: 'uploads/channel/image.jpg' }],
      };

      const result = await service.createFile(files, 1);

      expect(result).toEqual(mockMaterial);
      expect(prisma.channelMaterial.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { material: 'track.mp3' },
      });
      expect(prisma.channelMaterialImage.create).toHaveBeenCalledWith({
        data: {
          image: 'profile.png',
          primary: true,
          channel_material_id: 1,
        },
      });
      expect(prisma.channelMaterialImage.create).toHaveBeenCalledWith({
        data: { image: 'cover.jpg', cover: true, channel_material_id: 1 },
      });
      expect(prisma.channelPreviewMaterial.create).toHaveBeenCalledWith({
        data: { preview: 'preview.mp3', channel_material_id: 1 },
      });
    });
  });

  describe('updateMaterial', () => {
    it('should throw if channel material does not exist', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMaterial(
          { material: [{ path: 'uploads/channel/new.mp3' }] },
          1,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update material and delete old file', async () => {
      const mockMaterial = { id: 1, material: 'old.mp3' };
      prisma.channelMaterial.findFirst.mockResolvedValue(mockMaterial);
      prisma.channelMaterial.update.mockResolvedValue({
        id: 1,
        material: 'new.mp3',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateMaterial(
        { material: [{ path: 'uploads/channel/new.mp3' }] },
        1,
      );

      expect(result).toEqual({ message: 'Material Updated Successfully' });
      expect(prisma.channelMaterial.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { material: 'new.mp3' },
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith('channel', 'old.mp3');
    });
  });

  describe('showMaterial', () => {
    it('should throw NotFoundError if channel material not found', async () => {
      prisma.channelMaterial.findUnique.mockResolvedValue(null);
      const res = { sendFile: jest.fn() } as unknown as Response;

      await expect(service.showMaterial(1, res)).rejects.toThrow(NotFoundError);
    });

    it('should send file if channel material exists', async () => {
      prisma.channelMaterial.findUnique.mockResolvedValue({
        id: 1,
        material: 'channel_song.mp3',
      });
      const res = { sendFile: jest.fn() } as unknown as Response;

      await service.showMaterial(1, res);

      expect(res.sendFile).toHaveBeenCalledWith(
        expect.stringContaining('channel_song.mp3'),
      );
    });
  });
});
