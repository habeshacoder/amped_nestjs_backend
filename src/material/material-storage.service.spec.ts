import { Test, TestingModule } from '@nestjs/testing';
import { MaterialStorageService } from './material-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { ForbiddenException } from '@nestjs/common';
import { Response } from 'express';

describe('MaterialStorageService', () => {
  let service: MaterialStorageService;
  let fileStorage: FileStorageService;
  let prisma: {
    material: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    materialImage: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    previewMaterial: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      material: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      materialImage: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      previewMaterial: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialStorageService,
        FileStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MaterialStorageService>(MaterialStorageService);
    fileStorage = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFile', () => {
    it('should throw ForbiddenException if material not found', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(
        service.createFile({ material: [{ path: 'uploads/book.epub' }] }, 999),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should extract filenames and update material + related entities', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Test Material',
      };
      prisma.material.findFirst.mockResolvedValue(mockMaterial);
      prisma.material.update.mockResolvedValue({
        ...mockMaterial,
        material: 'book.epub',
      });
      prisma.materialImage.create.mockResolvedValue({ id: 10 });
      prisma.previewMaterial.create.mockResolvedValue({ id: 20 });

      const files = {
        material: [{ path: 'uploads/material/book.epub' }],
        profile: [{ path: 'uploads/profile/avatar.png' }],
        cover: [{ path: 'uploads/cover/cover.jpg' }],
        preview: [{ path: 'uploads/preview/sample.mp3' }],
        images: [{ path: 'uploads/images/gallery.png' }],
      };

      const result = await service.createFile(files, 1);

      expect(result).toEqual(mockMaterial);
      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { material: 'book.epub' },
      });
      expect(prisma.materialImage.create).toHaveBeenCalledWith({
        data: { image: 'avatar.png', primary: true, material_id: 1 },
      });
      expect(prisma.materialImage.create).toHaveBeenCalledWith({
        data: { image: 'cover.jpg', cover: true, material_id: 1 },
      });
      expect(prisma.previewMaterial.create).toHaveBeenCalledWith({
        data: { preview: 'sample.mp3', material_id: 1 },
      });
      expect(prisma.materialImage.create).toHaveBeenCalledWith({
        data: { image: 'gallery.png', material_id: 1 },
      });
    });
  });

  describe('updateMaterial', () => {
    it('should throw if material does not exist', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMaterial({ material: [{ path: 'uploads/new.epub' }] }, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update material file and delete previous file', async () => {
      const mockMaterial = { id: 1, material: 'old.epub' };
      prisma.material.findFirst.mockResolvedValue(mockMaterial);
      prisma.material.update.mockResolvedValue({
        id: 1,
        material: 'new.epub',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.updateMaterial(
        { material: [{ path: 'uploads/new.epub' }] },
        1,
      );

      expect(result).toEqual({ message: 'Material Updated Successfully' });
      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { material: 'new.epub' },
      });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'material',
        'old.epub',
      );
    });
  });

  describe('uploadMaterial', () => {
    it('should throw if material does not exist', async () => {
      prisma.material.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadMaterial(
          { path: 'uploads/file.epub' } as Express.Multer.File,
          1,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update material file and clean up previous file', async () => {
      const mockMaterial = { id: 1, material: 'existing.epub' };
      prisma.material.findUnique.mockResolvedValue(mockMaterial);
      prisma.material.update.mockResolvedValue({
        id: 1,
        material: 'uploaded.epub',
      });
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue(true);

      const result = await service.uploadMaterial(
        { path: 'uploads/uploaded.epub' } as Express.Multer.File,
        1,
      );

      expect(result).toEqual({ id: 1, material: 'uploaded.epub' });
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(
        'material',
        'existing.epub',
      );
    });
  });

  describe('showMaterial', () => {
    it('should throw ForbiddenException if material or file missing', async () => {
      prisma.material.findUnique.mockResolvedValue(null);
      const res = { sendFile: jest.fn() } as unknown as Response;

      await expect(service.showMaterial(1, res)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should send file when material exists', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 1,
        material: 'stored.epub',
      });
      const res = { sendFile: jest.fn() } as unknown as Response;

      await service.showMaterial(1, res);

      expect(res.sendFile).toHaveBeenCalledWith(
        expect.stringContaining('stored.epub'),
      );
    });
  });
});
