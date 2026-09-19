import { Test, TestingModule } from '@nestjs/testing';
import { MaterialQueryService } from './material-query.service';
import { PrismaService } from '../prisma/prisma.service';
import { Parent, Type } from '@prisma/client';

describe('MaterialQueryService', () => {
  let service: MaterialQueryService;
  let prisma: {
    material: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockMaterial = {
    id: 1,
    title: 'Query Book',
    type: Type.Book,
    parent: Parent.Publication,
  };

  beforeEach(async () => {
    prisma = {
      material: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialQueryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MaterialQueryService>(MaterialQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return all materials', async () => {
    prisma.material.findMany.mockResolvedValue([mockMaterial]);
    const result = await service.findAll();
    expect(result).toEqual([mockMaterial]);
  });

  it('findOne should return material by id', async () => {
    prisma.material.findUnique.mockResolvedValue(mockMaterial);
    const result = await service.findOne(1);
    expect(result).toEqual(mockMaterial);
  });
});
