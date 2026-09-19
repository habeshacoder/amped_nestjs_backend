import { Test, TestingModule } from '@nestjs/testing';
import { MaterialStorageService } from './material-storage.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MaterialStorageService', () => {
  let service: MaterialStorageService;
  let prisma: {
    material: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    materialImage: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    previewMaterial: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      material: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      materialImage: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      previewMaterial: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MaterialStorageService>(MaterialStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
