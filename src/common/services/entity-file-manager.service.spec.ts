import { Test, TestingModule } from '@nestjs/testing';
import {
  EntityFileManagerService,
  EntityFileManagerConfig,
} from './entity-file-manager.service';
import { FileStorageService } from './file-storage.service';
import { NotFoundError } from '../exceptions/domain-exceptions';
import { Response } from 'express';

describe('EntityFileManagerService', () => {
  let service: EntityFileManagerService;
  let fileStorage: FileStorageService;

  let materialParentDelegate: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let materialImageDelegate: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let materialPreviewDelegate: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  let channelParentDelegate: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let channelImageDelegate: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let channelPreviewDelegate: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  let materialConfig: EntityFileManagerConfig;
  let channelConfig: EntityFileManagerConfig;

  beforeEach(async () => {
    materialParentDelegate = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    materialImageDelegate = {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    materialPreviewDelegate = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    channelParentDelegate = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    channelImageDelegate = {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    channelPreviewDelegate = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    materialConfig = {
      subDirectory: 'material',
      foreignKey: 'material_id',
      entityName: 'Material',
      notFoundErrorCode: 'MATERIAL_NOT_FOUND',
      parentDelegate: materialParentDelegate,
      imageDelegate: materialImageDelegate,
      previewDelegate: materialPreviewDelegate,
    };

    channelConfig = {
      subDirectory: 'channel',
      foreignKey: 'channel_material_id',
      entityName: 'Material',
      notFoundErrorCode: 'CHANNEL_MATERIAL_NOT_FOUND',
      parentDelegate: channelParentDelegate,
      imageDelegate: channelImageDelegate,
      previewDelegate: channelPreviewDelegate,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EntityFileManagerService, FileStorageService],
    }).compile();

    service = module.get<EntityFileManagerService>(EntityFileManagerService);
    fileStorage = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Material Entity Operations', () => {
    it('should throw NotFoundError if parent material does not exist on updateImageField', async () => {
      materialParentDelegate.findFirst.mockResolvedValue(null);

      await expect(
        service.updateImageField(
          materialConfig,
          1,
          { profile: [{ path: 'uploads/profile.png' }] },
          'profile',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update profile image field for Material', async () => {
      materialParentDelegate.findFirst.mockResolvedValue({ id: 1 });
      materialImageDelegate.findFirst.mockResolvedValue(null);
      materialImageDelegate.create.mockResolvedValue({ id: 10 });

      const result = await service.updateImageField(
        materialConfig,
        1,
        { profile: [{ path: 'uploads/profile.png' }] },
        'profile',
      );

      expect(result).toEqual({
        message: 'Material Profile Updated Successfully',
      });
      expect(materialImageDelegate.create).toHaveBeenCalledWith({
        data: {
          image: 'profile.png',
          primary: true,
          cover: false,
          material_id: 1,
        },
      });
    });

    it('should update preview field for Material', async () => {
      materialParentDelegate.findFirst.mockResolvedValue({ id: 1 });
      materialPreviewDelegate.findFirst.mockResolvedValue({
        id: 20,
        preview: 'old_preview.mp3',
      });
      materialPreviewDelegate.update.mockResolvedValue({ id: 20 });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateImageField(
        materialConfig,
        1,
        { preview: [{ path: 'uploads/new_preview.mp3' }] },
        'preview',
      );

      expect(result).toEqual({
        message: 'Material Preview Updated Successfully',
      });
      expect(materialPreviewDelegate.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { preview: 'new_preview.mp3' },
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'material',
        'old_preview.mp3',
      );
    });

    it('should upload image field for Material', async () => {
      materialImageDelegate.findFirst.mockResolvedValue(null);
      materialImageDelegate.create.mockResolvedValue({
        id: 1,
        image: 'cover.jpg',
      });

      const file = {
        filename: 'cover.jpg',
        path: 'uploads/cover.jpg',
      } as Express.Multer.File;

      const result = await service.uploadImageField(
        materialConfig,
        file,
        1,
        'cover',
      );

      expect(result).toEqual({ id: 1, image: 'cover.jpg' });
      expect(materialImageDelegate.create).toHaveBeenCalledWith({
        data: {
          image: 'cover.jpg',
          primary: false,
          cover: true,
          material_id: 1,
        },
      });
    });

    it('should create multiple files for Material', async () => {
      const mockMaterial = { id: 1, title: 'Test Book' };
      materialParentDelegate.findFirst.mockResolvedValue(mockMaterial);
      materialParentDelegate.update.mockResolvedValue({
        ...mockMaterial,
        material: 'book.pdf',
      });
      materialImageDelegate.create.mockResolvedValue({ id: 10 });
      materialPreviewDelegate.create.mockResolvedValue({ id: 20 });

      const files = {
        material: [{ path: 'uploads/material/book.pdf' }],
        profile: [{ path: 'uploads/material/profile.png' }],
        cover: [{ path: 'uploads/material/cover.jpg' }],
        preview: [{ path: 'uploads/material/preview.mp3' }],
        image: [{ path: 'uploads/material/image.png' }],
      };

      const result = await service.createFile(materialConfig, files, 1);

      expect(result).toEqual(mockMaterial);
      expect(materialParentDelegate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { material: 'book.pdf' },
      });
      expect(materialImageDelegate.create).toHaveBeenCalledWith({
        data: { image: 'profile.png', primary: true, material_id: 1 },
      });
      expect(materialImageDelegate.create).toHaveBeenCalledWith({
        data: { image: 'cover.jpg', cover: true, material_id: 1 },
      });
      expect(materialPreviewDelegate.create).toHaveBeenCalledWith({
        data: { preview: 'preview.mp3', material_id: 1 },
      });
      expect(materialImageDelegate.create).toHaveBeenCalledWith({
        data: { image: 'image.png', material_id: 1 },
      });
    });
  });

  describe('ChannelMaterial Entity Operations', () => {
    it('should throw NotFoundError if channel material does not exist on updateImageField', async () => {
      channelParentDelegate.findFirst.mockResolvedValue(null);

      await expect(
        service.updateImageField(
          channelConfig,
          2,
          { cover: [{ path: 'uploads/cover.png' }] },
          'cover',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update cover image field for ChannelMaterial', async () => {
      channelParentDelegate.findFirst.mockResolvedValue({ id: 2 });
      channelImageDelegate.findFirst.mockResolvedValue(null);
      channelImageDelegate.create.mockResolvedValue({ id: 15 });

      const result = await service.updateImageField(
        channelConfig,
        2,
        { cover: [{ path: 'uploads/channel_cover.png' }] },
        'cover',
      );

      expect(result).toEqual({
        message: 'Material Cover Updated Successfully',
      });
      expect(channelImageDelegate.create).toHaveBeenCalledWith({
        data: {
          image: 'channel_cover.png',
          primary: false,
          cover: true,
          channel_material_id: 2,
        },
      });
    });

    it('should upload preview for ChannelMaterial', async () => {
      channelPreviewDelegate.findFirst.mockResolvedValue(null);
      channelPreviewDelegate.create.mockResolvedValue({
        id: 25,
        preview: 'sample.mp3',
      });

      const file = {
        filename: 'sample.mp3',
        path: 'uploads/sample.mp3',
      } as Express.Multer.File;

      const result = await service.uploadImageField(
        channelConfig,
        file,
        2,
        'preview',
      );

      expect(result).toEqual({ id: 25, preview: 'sample.mp3' });
      expect(channelPreviewDelegate.create).toHaveBeenCalledWith({
        data: {
          preview: 'sample.mp3',
          channel_material_id: 2,
        },
      });
    });

    it('should stream profile image for ChannelMaterial', async () => {
      channelImageDelegate.findFirst.mockResolvedValue({
        id: 30,
        image: 'avatar.png',
      });
      const res = { sendFile: jest.fn() } as unknown as Response;

      await service.showProfileImage(channelConfig, 2, res);

      expect(res.sendFile).toHaveBeenCalledWith(
        expect.stringContaining('avatar.png'),
      );
    });

    it('should stream main file for ChannelMaterial', async () => {
      channelParentDelegate.findUnique.mockResolvedValue({
        id: 2,
        material: 'track.mp3',
      });
      const res = { sendFile: jest.fn() } as unknown as Response;

      await service.showMainFile(channelConfig, 2, res);

      expect(res.sendFile).toHaveBeenCalledWith(
        expect.stringContaining('track.mp3'),
      );
    });
  });
});
