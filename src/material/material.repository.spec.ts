import { Test, TestingModule } from '@nestjs/testing';
import { MaterialRepository } from './material.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('MaterialRepository', () => {
  let repository: MaterialRepository;
  let prisma: {
    material: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    materialUser: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    materialImage: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      material: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      materialUser: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      materialImage: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<MaterialRepository>(MaterialRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should delegate findMany to prisma.material.findMany', async () => {
    const args = { take: 5 };
    prisma.material.findMany.mockResolvedValue(['test']);
    const result = await repository.findMany(args);
    expect(result).toEqual(['test']);
    expect(prisma.material.findMany).toHaveBeenCalledWith(args);
  });

  it('should delegate findUnique to prisma.material.findUnique', async () => {
    const args = { where: { id: 1 } };
    prisma.material.findUnique.mockResolvedValue({ id: 1 });
    const result = await repository.findUnique(args);
    expect(result).toEqual({ id: 1 });
    expect(prisma.material.findUnique).toHaveBeenCalledWith(args);
  });

  it('should delegate findFirst to prisma.material.findFirst', async () => {
    const args = { where: { id: 1 } };
    prisma.material.findFirst.mockResolvedValue({ id: 1 });
    const result = await repository.findFirst(args);
    expect(result).toEqual({ id: 1 });
    expect(prisma.material.findFirst).toHaveBeenCalledWith(args);
  });

  it('should delegate count to prisma.material.count', async () => {
    prisma.material.count.mockResolvedValue(10);
    const result = await repository.count();
    expect(result).toBe(10);
    expect(prisma.material.count).toHaveBeenCalledWith(undefined);
  });

  it('should delegate create to prisma.material.create', async () => {
    const args = { data: { title: 'Book' } as any };
    prisma.material.create.mockResolvedValue({ id: 1, title: 'Book' });
    const result = await repository.create(args);
    expect(result).toEqual({ id: 1, title: 'Book' });
    expect(prisma.material.create).toHaveBeenCalledWith(args);
  });

  it('should delegate update to prisma.material.update', async () => {
    const args = { where: { id: 1 }, data: { title: 'Updated' } as any };
    prisma.material.update.mockResolvedValue({ id: 1, title: 'Updated' });
    const result = await repository.update(args);
    expect(result).toEqual({ id: 1, title: 'Updated' });
    expect(prisma.material.update).toHaveBeenCalledWith(args);
  });

  it('should delegate delete to prisma.material.delete', async () => {
    const args = { where: { id: 1 } };
    prisma.material.delete.mockResolvedValue({ id: 1 });
    const result = await repository.delete(args);
    expect(result).toEqual({ id: 1 });
    expect(prisma.material.delete).toHaveBeenCalledWith(args);
  });

  it('should delegate findMaterialUsers to prisma.materialUser.findMany', async () => {
    const args = { where: { user_id: 'user-1' } };
    prisma.materialUser.findMany.mockResolvedValue([{ id: 1 }]);
    const result = await repository.findMaterialUsers(args);
    expect(result).toEqual([{ id: 1 }]);
    expect(prisma.materialUser.findMany).toHaveBeenCalledWith(args);
  });

  it('should delegate findFirstMaterialUser to prisma.materialUser.findFirst', async () => {
    const args = { where: { user_id: 'user-1' } };
    prisma.materialUser.findFirst.mockResolvedValue({ id: 1 });
    const result = await repository.findFirstMaterialUser(args);
    expect(result).toEqual({ id: 1 });
    expect(prisma.materialUser.findFirst).toHaveBeenCalledWith(args);
  });

  it('should delegate findMaterialImages to prisma.materialImage.findMany', async () => {
    const args = { where: { material_id: 1 } };
    prisma.materialImage.findMany.mockResolvedValue([{ id: 10 }]);
    const result = await repository.findMaterialImages(args);
    expect(result).toEqual([{ id: 10 }]);
    expect(prisma.materialImage.findMany).toHaveBeenCalledWith(args);
  });

  it('should delegate findFirstMaterialImage to prisma.materialImage.findFirst', async () => {
    const args = { where: { material_id: 1 } };
    prisma.materialImage.findFirst.mockResolvedValue({ id: 10 });
    const result = await repository.findFirstMaterialImage(args);
    expect(result).toEqual({ id: 10 });
    expect(prisma.materialImage.findFirst).toHaveBeenCalledWith(args);
  });
});
