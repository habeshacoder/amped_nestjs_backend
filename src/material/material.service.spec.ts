import { Test, TestingModule } from '@nestjs/testing';
import { MaterialService } from './material.service';
import { PrismaService } from '../prisma/prisma.service';
import { Parent, Type } from '@prisma/client';
import { MaterialQueryService } from './material-query.service';
import { MaterialStorageService } from './material-storage.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { EntityFileManagerService } from '../common/services/entity-file-manager.service';
import {
  ConflictError,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

describe('MaterialService', () => {
  let service: MaterialService;
  let storageService: MaterialStorageService;
  let prisma: {
    material: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockMaterial = {
    id: 1,
    title: 'Great Book',
    description: 'A very nice book',
    type: Type.Book,
    parent: Parent.Publication,
  };

  beforeEach(async () => {
    prisma = {
      material: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialService,
        MaterialQueryService,
        MaterialStorageService,
        FileStorageService,
        EntityFileManagerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MaterialService>(MaterialService);
    storageService = module.get<MaterialStorageService>(MaterialStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all materials', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.findAll();
      expect(result).toEqual([mockMaterial]);
    });
  });

  describe('getHomeItems', () => {
    it('should delegate getHomeItems to queryService', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.getHomeItems();
      expect(result).toEqual([mockMaterial]);
    });
  });

  describe('getMaterialByType', () => {
    it('should filter materials by type', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.getMaterialByType(Type.Book);
      expect(result).toHaveLength(1);
    });
  });

  describe('getMaterialByParent', () => {
    it('should filter materials by parent', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.getMaterialByParent(Parent.Publication);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a material successfully', async () => {
      prisma.material.create.mockResolvedValue(mockMaterial);
      const dto = {
        title: 'New Material',
        description: 'Description',
        price: '10',
        type: Type.Book,
        parent: Parent.Publication,
      } as any;

      const result = await service.create(dto);
      expect(result).toEqual(mockMaterial);
    });

    it('should throw ConflictError on unique constraint violation (P2002)', async () => {
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      prisma.material.create.mockRejectedValue(p2002);

      await expect(
        service.create({ title: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should throw NotFoundError if material to update does not exist', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, { title: 'Non-existent' } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update material successfully', async () => {
      prisma.material.findFirst.mockResolvedValue(mockMaterial);
      prisma.material.update.mockResolvedValue({
        ...mockMaterial,
        title: 'Updated Title',
      });

      const result = await service.update(1, { title: 'Updated Title' } as any);
      expect(result.title).toBe('Updated Title');
    });

    it('should throw ConflictError on P2002 during update', async () => {
      prisma.material.findFirst.mockResolvedValue(mockMaterial);
      const p2002 = new PrismaClientKnownRequestError('Duplicate error', {
        code: 'P2002',
        clientVersion: '5.x',
      });
      prisma.material.update.mockRejectedValue(p2002);

      await expect(
        service.update(1, { title: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError if material to remove does not exist', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundError);
    });

    it('should delete material successfully', async () => {
      prisma.material.findFirst.mockResolvedValue(mockMaterial);
      prisma.material.delete.mockResolvedValue(mockMaterial);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Material deleted successfully' });
    });
  });

  describe('Delegated Storage Methods', () => {
    it('should delegate createFile to storageService', async () => {
      jest
        .spyOn(storageService, 'createFile')
        .mockResolvedValue(mockMaterial as any);
      const result = await service.createFile({}, 1);
      expect(storageService.createFile).toHaveBeenCalledWith({}, 1);
      expect(result).toEqual(mockMaterial);
    });

    it('should delegate updateMaterial to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterial')
        .mockResolvedValue({ message: 'Updated' } as any);
      const result = await service.updateMaterial({}, 1);
      expect(storageService.updateMaterial).toHaveBeenCalledWith({}, 1);
      expect(result).toEqual({ message: 'Updated' });
    });

    it('should delegate updateMaterialProfile to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialProfile')
        .mockResolvedValue({ message: 'Profile Updated' } as any);
      const result = await service.updateMaterialProfile({}, 1);
      expect(storageService.updateMaterialProfile).toHaveBeenCalledWith({}, 1);
      expect(result).toEqual({ message: 'Profile Updated' });
    });

    it('should delegate updateMaterialCover to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialCover')
        .mockResolvedValue({ message: 'Cover Updated' } as any);
      const result = await service.updateMaterialCover({}, 1);
      expect(storageService.updateMaterialCover).toHaveBeenCalledWith({}, 1);
      expect(result).toEqual({ message: 'Cover Updated' });
    });

    it('should delegate updateMaterialPreview to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialPreview')
        .mockResolvedValue({ message: 'Preview Updated' } as any);
      const result = await service.updateMaterialPreview({}, 1);
      expect(storageService.updateMaterialPreview).toHaveBeenCalledWith({}, 1);
      expect(result).toEqual({ message: 'Preview Updated' });
    });

    it('should delegate updateMaterialImage to storageService', async () => {
      jest
        .spyOn(storageService, 'updateMaterialImage')
        .mockResolvedValue({ message: 'Image Updated' } as any);
      const result = await service.updateMaterialImage({}, 1);
      expect(storageService.updateMaterialImage).toHaveBeenCalledWith({}, 1);
      expect(result).toEqual({ message: 'Image Updated' });
    });

    it('should delegate uploadMaterial to storageService', async () => {
      const mockFile = { filename: 'test.pdf' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterial')
        .mockResolvedValue(mockMaterial as any);
      const result = await service.uploadMaterial(mockFile, 1);
      expect(storageService.uploadMaterial).toHaveBeenCalledWith(mockFile, 1);
      expect(result).toEqual(mockMaterial);
    });

    it('should delegate showMaterial to storageService', async () => {
      const mockRes = {} as Response;
      jest.spyOn(storageService, 'showMaterial').mockResolvedValue(undefined);
      await service.showMaterial(1, mockRes);
      expect(storageService.showMaterial).toHaveBeenCalledWith(1, mockRes);
    });

    it('should delegate uploadMaterialProfile to storageService', async () => {
      const mockFile = { filename: 'profile.jpg' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterialProfile')
        .mockResolvedValue({ message: 'Success' } as any);
      await service.uploadMaterialProfile(mockFile, 1);
      expect(storageService.uploadMaterialProfile).toHaveBeenCalledWith(
        mockFile,
        1,
      );
    });

    it('should delegate showMaterialProfile to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialProfile')
        .mockResolvedValue(undefined);
      await service.showMaterialProfile(1, mockRes);
      expect(storageService.showMaterialProfile).toHaveBeenCalledWith(
        1,
        mockRes,
      );
    });

    it('should delegate uploadMaterialCover to storageService', async () => {
      const mockFile = { filename: 'cover.jpg' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterialCover')
        .mockResolvedValue({ message: 'Success' } as any);
      await service.uploadMaterialCover(mockFile, 1);
      expect(storageService.uploadMaterialCover).toHaveBeenCalledWith(
        mockFile,
        1,
      );
    });

    it('should delegate showMaterialCover to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialCover')
        .mockResolvedValue(undefined);
      await service.showMaterialCover(1, mockRes);
      expect(storageService.showMaterialCover).toHaveBeenCalledWith(1, mockRes);
    });

    it('should delegate uploadMaterialImage to storageService', async () => {
      const mockFiles = [{ filename: 'img.jpg' }] as Express.Multer.File[];
      jest
        .spyOn(storageService, 'uploadMaterialImage')
        .mockResolvedValue([{ id: 1 }] as any);
      await service.uploadMaterialImage(mockFiles, 1);
      expect(storageService.uploadMaterialImage).toHaveBeenCalledWith(
        mockFiles,
        1,
      );
    });

    it('should delegate showMaterialImage to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialImage')
        .mockResolvedValue(undefined);
      await service.showMaterialImage(1, mockRes);
      expect(storageService.showMaterialImage).toHaveBeenCalledWith(1, mockRes);
    });

    it('should delegate uploadMaterialPreview to storageService', async () => {
      const mockFile = { filename: 'prev.mp3' } as Express.Multer.File;
      jest
        .spyOn(storageService, 'uploadMaterialPreview')
        .mockResolvedValue({ id: 1 } as any);
      await service.uploadMaterialPreview(mockFile, 1);
      expect(storageService.uploadMaterialPreview).toHaveBeenCalledWith(
        mockFile,
        1,
      );
    });

    it('should delegate showMaterialPreview to storageService', async () => {
      const mockRes = {} as Response;
      jest
        .spyOn(storageService, 'showMaterialPreview')
        .mockResolvedValue(undefined);
      await service.showMaterialPreview(1, mockRes);
      expect(storageService.showMaterialPreview).toHaveBeenCalledWith(
        1,
        mockRes,
      );
    });
  });
});
