import { BaseEntityStorageService } from './base-entity-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EntityFileManagerConfig,
  EntityFileManagerService,
} from './entity-file-manager.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ConflictError } from '../exceptions/domain-exceptions';
import { Response } from 'express';

class TestStorageService extends BaseEntityStorageService {
  protected readonly config: EntityFileManagerConfig = {
    subDirectory: 'test',
    foreignKey: 'test_id',
    parentDelegate: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    imageDelegate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    previewDelegate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  public testHandlePrismaError(error: unknown) {
    return this.handlePrismaError(error);
  }
}

describe('BaseEntityStorageService', () => {
  let service: TestStorageService;
  let fileManager: Partial<EntityFileManagerService>;
  let prisma: Partial<PrismaService>;

  beforeEach(() => {
    prisma = {};
    fileManager = {
      createFile: jest.fn().mockResolvedValue({ id: 1 }),
      updateMainFile: jest.fn().mockResolvedValue({ message: 'Updated' }),
      updateImageField: jest
        .fn()
        .mockResolvedValue({ message: 'Image Updated' }),
      updateAdditionalImage: jest
        .fn()
        .mockResolvedValue({ message: 'Additional Image Updated' }),
      uploadMainFile: jest.fn().mockResolvedValue({ id: 1 }),
      uploadImageField: jest.fn().mockResolvedValue({ id: 2 }),
      uploadMultipleImages: jest.fn().mockResolvedValue([{ id: 3 }]),
      showMainFile: jest.fn().mockResolvedValue(undefined),
      showProfileImage: jest.fn().mockResolvedValue(undefined),
      showCoverImage: jest.fn().mockResolvedValue(undefined),
      showImageById: jest.fn().mockResolvedValue(undefined),
      showPreviewById: jest.fn().mockResolvedValue(undefined),
    };

    service = new TestStorageService(
      prisma as PrismaService,
      fileManager as EntityFileManagerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate createFile to fileManager', async () => {
    const result = await service.createFile({}, 1);
    expect(fileManager.createFile).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });

  it('should delegate updateMaterial to fileManager', async () => {
    const result = await service.updateMaterial({}, 1);
    expect(fileManager.updateMainFile).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Updated' });
  });

  it('should delegate updateMaterialProfile to fileManager', async () => {
    const result = await service.updateMaterialProfile({}, 1);
    expect(fileManager.updateImageField).toHaveBeenCalledWith(
      expect.anything(),
      1,
      {},
      'profile',
    );
    expect(result).toEqual({ message: 'Image Updated' });
  });

  it('should delegate updateMaterialCover to fileManager', async () => {
    const result = await service.updateMaterialCover({}, 1);
    expect(fileManager.updateImageField).toHaveBeenCalledWith(
      expect.anything(),
      1,
      {},
      'cover',
    );
    expect(result).toEqual({ message: 'Image Updated' });
  });

  it('should delegate updateMaterialPreview to fileManager', async () => {
    const result = await service.updateMaterialPreview({}, 1);
    expect(fileManager.updateImageField).toHaveBeenCalledWith(
      expect.anything(),
      1,
      {},
      'preview',
    );
    expect(result).toEqual({ message: 'Image Updated' });
  });

  it('should delegate updateMaterialImage to fileManager', async () => {
    const result = await service.updateMaterialImage({}, 1);
    expect(fileManager.updateAdditionalImage).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Additional Image Updated' });
  });

  it('should delegate uploadMaterial to fileManager', async () => {
    const file = {} as Express.Multer.File;
    const result = await service.uploadMaterial(file, 1);
    expect(fileManager.uploadMainFile).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });

  it('should delegate showMaterial to fileManager', async () => {
    const res = {} as Response;
    await service.showMaterial(1, res);
    expect(fileManager.showMainFile).toHaveBeenCalled();
  });

  it('should delegate uploadMaterialProfile to fileManager', async () => {
    const file = {} as Express.Multer.File;
    const result = await service.uploadMaterialProfile(file, 1);
    expect(fileManager.uploadImageField).toHaveBeenCalledWith(
      expect.anything(),
      file,
      1,
      'profile',
    );
    expect(result).toEqual({ id: 2 });
  });

  it('should delegate showMaterialProfile to fileManager', async () => {
    const res = {} as Response;
    await service.showMaterialProfile(1, res);
    expect(fileManager.showProfileImage).toHaveBeenCalled();
  });

  it('should delegate uploadMaterialCover to fileManager', async () => {
    const file = {} as Express.Multer.File;
    const result = await service.uploadMaterialCover(file, 1);
    expect(fileManager.uploadImageField).toHaveBeenCalledWith(
      expect.anything(),
      file,
      1,
      'cover',
    );
    expect(result).toEqual({ id: 2 });
  });

  it('should delegate showMaterialCover to fileManager', async () => {
    const res = {} as Response;
    await service.showMaterialCover(1, res);
    expect(fileManager.showCoverImage).toHaveBeenCalled();
  });

  it('should delegate uploadMaterialImage to fileManager', async () => {
    const files = [{}] as Express.Multer.File[];
    const result = await service.uploadMaterialImage(files, 1);
    expect(fileManager.uploadMultipleImages).toHaveBeenCalled();
    expect(result).toEqual([{ id: 3 }]);
  });

  it('should delegate showMaterialImage to fileManager', async () => {
    const res = {} as Response;
    await service.showMaterialImage(1, res);
    expect(fileManager.showImageById).toHaveBeenCalled();
  });

  it('should delegate uploadMaterialPreview to fileManager', async () => {
    const file = {} as Express.Multer.File;
    const result = await service.uploadMaterialPreview(file, 1);
    expect(fileManager.uploadImageField).toHaveBeenCalledWith(
      expect.anything(),
      file,
      1,
      'preview',
    );
    expect(result).toEqual({ id: 2 });
  });

  it('should delegate showMaterialPreview to fileManager', async () => {
    const res = {} as Response;
    await service.showMaterialPreview(1, res);
    expect(fileManager.showPreviewById).toHaveBeenCalled();
  });

  it('should throw ConflictError on Prisma P2002 via handlePrismaError', () => {
    const p2002 = new PrismaClientKnownRequestError('Unique error', {
      code: 'P2002',
      clientVersion: '5.x',
    });

    expect(() => service.testHandlePrismaError(p2002)).toThrow(ConflictError);
  });
});
