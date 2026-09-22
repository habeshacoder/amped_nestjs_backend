import { Test, TestingModule } from '@nestjs/testing';
import { ChannelMaterialService } from './channel-material.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictError,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';
import { Parent, Type } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

import { ChannelMaterialQueryService } from './channel-material-query.service';
import { ChannelMaterialStorageService } from './channel-material-storage.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { EntityFileManagerService } from '../common/services/entity-file-manager.service';

describe('ChannelMaterialService', () => {
  let service: ChannelMaterialService;
  let storageService: ChannelMaterialStorageService;
  let prisma: {
    channelMaterial: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    materialInSubscriptionPlan: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      channelMaterial: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      materialInSubscriptionPlan: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelMaterialService,
        ChannelMaterialQueryService,
        ChannelMaterialStorageService,
        FileStorageService,
        EntityFileManagerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelMaterialService>(ChannelMaterialService);
    storageService = module.get<ChannelMaterialStorageService>(
      ChannelMaterialStorageService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a channel material without subscriptions', async () => {
      const dto: any = {
        title: 'New Channel Material',
        parent: Parent.Publication,
        type: Type.Book,
        genere: 'News',
        catagory: 'Tech',
        description: 'Desc',
        author: 'Author',
        reader: 'Reader',
        translator: 'Translator',
        length_minute: 10,
        length_page: 5,
        first_published_at: new Date(),
        language: 'EN',
        publisher: 'Publisher',
        episode: 1,
        continues_from: 0,
        sellerProfile_id: 1,
      };

      prisma.channelMaterial.create.mockResolvedValue({ id: 101, ...dto });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 101);
      expect(prisma.materialInSubscriptionPlan.create).not.toHaveBeenCalled();
    });

    it('should create channel material with subscription ids', async () => {
      const dto: any = {
        title: 'Subscribed Channel Material',
        parent: Parent.Audio,
        type: Type.Audiobook,
        genere: 'Podcast',
        catagory: 'Tech',
        sellerProfile_id: 1,
        subscription_id: [1, 2],
      };

      prisma.channelMaterial.create.mockResolvedValue({ id: 102, ...dto });
      prisma.materialInSubscriptionPlan.create.mockResolvedValue({});

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 102);
      expect(prisma.materialInSubscriptionPlan.create).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictError on unique constraint violation (P2002)', async () => {
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      prisma.channelMaterial.create.mockRejectedValue(p2002);

      await expect(
        service.create({ title: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('findAll', () => {
    it('should return all channel materials with includes', async () => {
      prisma.channelMaterial.findMany.mockResolvedValue([
        { id: 1, title: 'Item 1' },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.channelMaterial.findMany).toHaveBeenCalledWith({
        include: {
          channel_material_image: true,
          channel_material_preview: true,
          material_in_subscription_plan: true,
          rate: true,
          report: true,
        },
      });
    });
  });

  describe('getMaterialByType', () => {
    it('should filter channel materials by type', async () => {
      prisma.channelMaterial.findMany.mockResolvedValue([
        { id: 1, type: Type.Book },
      ]);

      const result = await service.getMaterialByType(Type.Book);
      expect(result).toHaveLength(1);
      expect(prisma.channelMaterial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: Type.Book },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return channel material if found', async () => {
      prisma.channelMaterial.findUnique.mockResolvedValue({
        id: 1,
        title: 'Found',
      });

      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, title: 'Found' });
    });

    it('should return message if material not found', async () => {
      prisma.channelMaterial.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toEqual({ message: 'Material Not Found' });
    });
  });

  describe('findForSeller', () => {
    it('should return channel materials for seller', async () => {
      prisma.channelMaterial.findMany.mockResolvedValue([
        { id: 1, sellerProfile_id: 5 },
      ]);

      const result = await service.findForSeller(5);
      expect(result).toHaveLength(1);
      expect(prisma.channelMaterial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerProfile_id: 5 },
        }),
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundError if material does not exist', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue(null);

      await expect(
        service.update(99, { title: 'Updated' } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update channel material successfully', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue({ id: 10 });
      prisma.channelMaterial.update.mockResolvedValue({
        id: 10,
        title: 'Updated',
      });

      const result = await service.update(10, { title: 'Updated' } as any);
      expect(result).toEqual({ id: 10, title: 'Updated' });
    });

    it('should throw ConflictError on P2002 during update', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue({ id: 10 });
      const p2002 = new PrismaClientKnownRequestError('Duplicate error', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      prisma.channelMaterial.update.mockRejectedValue(p2002);

      await expect(
        service.update(10, { title: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError if material does not exist', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundError);
    });

    it('should delete material if exists', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue({ id: 10 });
      prisma.channelMaterial.delete.mockResolvedValue({ id: 10 });

      const result = await service.remove(10);
      expect(result).toEqual({ message: 'Material deleted successfully' });
    });
  });

  describe('Delegated Storage Methods', () => {
    const mockItem = { id: 10, title: 'Test' };

    it('should delegate createFile to storageService', async () => {
      jest
        .spyOn(storageService, 'createFile')
        .mockResolvedValue(mockItem as any);
      const result = await service.createFile({}, 10);
      expect(storageService.createFile).toHaveBeenCalledWith({}, 10);
      expect(result).toEqual(mockItem);
    });

    it('should delegate updateMaterial to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterial')
        .mockResolvedValue({ message: 'Updated' } as any);
      const result = await service.updateMaterial({}, 10);
      expect(storageService.updateMaterial).toHaveBeenCalledWith({}, 10);
      expect(result).toEqual({ message: 'Updated' });
    });

    it('should delegate updateMaterialProfile to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialProfile')
        .mockResolvedValue({ message: 'Profile Updated' } as any);
      const result = await service.updateMaterialProfile({}, 10);
      expect(storageService.updateMaterialProfile).toHaveBeenCalledWith({}, 10);
      expect(result).toEqual({ message: 'Profile Updated' });
    });

    it('should delegate updateMaterialCover to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialCover')
        .mockResolvedValue({ message: 'Cover Updated' } as any);
      const result = await service.updateMaterialCover({}, 10);
      expect(storageService.updateMaterialCover).toHaveBeenCalledWith({}, 10);
      expect(result).toEqual({ message: 'Cover Updated' });
    });

    it('should delegate updateMaterialPreview to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialPreview')
        .mockResolvedValue({ message: 'Preview Updated' } as any);
      const result = await service.updateMaterialPreview({}, 10);
      expect(storageService.updateMaterialPreview).toHaveBeenCalledWith({}, 10);
      expect(result).toEqual({ message: 'Preview Updated' });
    });

    it('should delegate updateMaterialImage to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialImage')
        .mockResolvedValue({ message: 'Image Updated' } as any);
      const result = await service.updateMaterialImage({}, 10);
      expect(storageService.updateMaterialImage).toHaveBeenCalledWith({}, 10);
      expect(result).toEqual({ message: 'Image Updated' });
    });

    it('should delegate uploadMaterial to storageService', async () => {
      const mockFile = { filename: 'test.pdf' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterial')
        .mockResolvedValue(mockItem as any);
      const result = await service.uploadMaterial(mockFile, 10);
      expect(storageService.uploadMaterial).toHaveBeenCalledWith(mockFile, 10);
      expect(result).toEqual(mockItem);
    });

    it('should delegate showMaterial to storageService', async () => {
      const mockRes = {} as Response;
      jest.spyOn(storageService, 'showMaterial').mockResolvedValue(undefined);
      await service.showMaterial(10, mockRes);
      expect(storageService.showMaterial).toHaveBeenCalledWith(10, mockRes);
    });

    it('should delegate uploadMaterialProfile to storageService', async () => {
      const mockFile = { filename: 'profile.jpg' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterialProfile')
        .mockResolvedValue({ message: 'Success' } as any);
      await service.uploadMaterialProfile(mockFile, 10);
      expect(storageService.uploadMaterialProfile).toHaveBeenCalledWith(
        mockFile,
        10,
      );
    });

    it('should delegate showMaterialProfile to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialProfile')
        .mockResolvedValue(undefined);
      await service.showMaterialProfile(10, mockRes);
      expect(storageService.showMaterialProfile).toHaveBeenCalledWith(
        10,
        mockRes,
      );
    });

    it('should delegate uploadMaterialCover to storageService', async () => {
      const mockFile = { filename: 'cover.jpg' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterialCover')
        .mockResolvedValue({ message: 'Success' } as any);
      await service.uploadMaterialCover(mockFile, 10);
      expect(storageService.uploadMaterialCover).toHaveBeenCalledWith(
        mockFile,
        10,
      );
    });

    it('should delegate showMaterialCover to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialCover')
        .mockResolvedValue(undefined);
      await service.showMaterialCover(10, mockRes);
      expect(storageService.showMaterialCover).toHaveBeenCalledWith(
        10,
        mockRes,
      );
    });

    it('should delegate uploadMaterialImage to storageService', async () => {
      const mockFiles = [{ filename: 'img.jpg' }] as Express.Multer.File[];
      jest
        .spyOn(storageService, 'uploadMaterialImage')
        .mockResolvedValue([{ id: 1 }] as any);
      await service.uploadMaterialImage(mockFiles, 10);
      expect(storageService.uploadMaterialImage).toHaveBeenCalledWith(
        mockFiles,
        10,
      );
    });

    it('should delegate showMaterialImage to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialImage')
        .mockResolvedValue(undefined);
      await service.showMaterialImage(10, mockRes);
      expect(storageService.showMaterialImage).toHaveBeenCalledWith(
        10,
        mockRes,
      );
    });

    it('should delegate uploadMaterialPreview to storageService', async () => {
      const mockFile = { filename: 'prev.mp3' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterialPreview')
        .mockResolvedValue({ id: 1 } as any);
      await service.uploadMaterialPreview(mockFile, 10);
      expect(storageService.uploadMaterialPreview).toHaveBeenCalledWith(
        mockFile,
        10,
      );
    });

    it('should delegate showMaterialPreview to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialPreview')
        .mockResolvedValue(undefined);
      await service.showMaterialPreview(10, mockRes);
      expect(storageService.showMaterialPreview).toHaveBeenCalledWith(
        10,
        mockRes,
      );
    });
  });
});
