import { Test, TestingModule } from '@nestjs/testing';
import { MaterialService } from './material.service';
import { PrismaService } from '../prisma/prisma.service';
import { Parent, Type } from '@prisma/client';

import { MaterialQueryService } from './material-query.service';
import { MaterialStorageService } from './material-storage.service';

describe('MaterialService', () => {
  let service: MaterialService;
  let prisma: {
    material: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
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
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialService,
        MaterialQueryService,
        MaterialStorageService,
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
});
