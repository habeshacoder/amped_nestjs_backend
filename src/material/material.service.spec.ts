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

describe('MaterialService', () => {
  let service: MaterialService;
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
    it('should return empty list of home items', async () => {
      const result = await service.getHomeItems();
      expect(Array.isArray(result)).toBe(true);
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
});
