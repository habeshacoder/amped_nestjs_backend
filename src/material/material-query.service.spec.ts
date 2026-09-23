import { Test, TestingModule } from '@nestjs/testing';
import { MaterialQueryService } from './material-query.service';
import { PrismaService } from '../prisma/prisma.service';
import { Parent, Type } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  ConflictError,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';

describe('MaterialQueryService', () => {
  let service: MaterialQueryService;
  let prisma: {
    material: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
    };
    materialUser: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    materialImage: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const mockMaterial = {
    id: 1,
    title: 'Query Book',
    type: Type.Book,
    parent: Parent.Publication,
    sellerProfile_id: 10,
    first_published_at: '2023',
  };

  beforeEach(async () => {
    prisma = {
      material: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      materialUser: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      materialImage: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
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

  describe('findAll', () => {
    it('should return all materials ordered by id asc', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.findAll();
      expect(result).toEqual([mockMaterial]);
      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { id: 'asc' } }),
      );
    });
  });

  describe('getHomeItems', () => {
    it('should query top 10 materials ordered by id desc with relations', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.getHomeItems();

      expect(result).toEqual([mockMaterial]);
      expect(prisma.material.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { id: 'desc' },
        include: {
          material_image: true,
          material_preview: true,
          rate: true,
          report: true,
          SellerProfile: true,
        },
      });
    });
  });

  describe('getMaterialByType', () => {
    it('should return up to 3 materials', async () => {
      prisma.material.findMany.mockResolvedValue([
        { ...mockMaterial, id: 1 },
        { ...mockMaterial, id: 2 },
        { ...mockMaterial, id: 3 },
        { ...mockMaterial, id: 4 },
      ]);

      const result = await service.getMaterialByType(Type.Book);
      expect(result.length).toBe(3);
    });
  });

  describe('getMaterialByParent', () => {
    it('should return materials by parent', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.getMaterialByParent(Parent.Publication);
      expect(result).toEqual([mockMaterial]);
      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parent: Parent.Publication } }),
      );
    });
  });

  describe('getMaterialByPublicationYear', () => {
    it('should return materials by publication year', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.getMaterialByPublicationYear('2023');
      expect(result).toEqual([mockMaterial]);
    });
  });

  describe('paginateMaterialByType', () => {
    it('should return paginated materials for first page', async () => {
      prisma.material.count.mockResolvedValue(12);
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 0,
      });
      expect(result.Materials).toEqual([mockMaterial]);
      expect(result.Meta.self).toBe(0);
      expect(result.Meta.prev).toBeNull();
      expect(result.Meta.next).toBe(1);
      expect(result.Meta.last).toBe(2);
      expect(result.Meta.Num_Of_Materials).toBe(12);
      expect(result.Meta.Num_Of_Pages).toBe(3);
      expect(result.Meta.Links).toHaveLength(5);
      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
          where: { type: Type.Book },
        }),
      );
    });

    it('should calculate skip and pagination links correctly for middle page', async () => {
      prisma.material.count.mockResolvedValue(12);
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 1,
      });
      expect(result.Meta.self).toBe(1);
      expect(result.Meta.prev).toBe(0);
      expect(result.Meta.next).toBe(2);
      expect(result.Meta.last).toBe(2);
      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should set next to null on last page', async () => {
      prisma.material.count.mockResolvedValue(12);
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 2,
      });
      expect(result.Meta.self).toBe(2);
      expect(result.Meta.prev).toBe(1);
      expect(result.Meta.next).toBeNull();
      expect(result.Meta.last).toBe(2);
      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should handle count === 0 when page === 0', async () => {
      prisma.material.count.mockResolvedValue(0);
      prisma.material.findMany.mockResolvedValue([]);

      const result = await service.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 0,
      });
      expect(result.Materials).toEqual([]);
      expect(result.Meta.Num_Of_Materials).toBe(0);
      expect(result.Meta.Num_Of_Pages).toBe(0);
      expect(result.Meta.self).toBe(0);
      expect(result.Meta.prev).toBeNull();
      expect(result.Meta.next).toBeNull();
    });

    it('should throw NotFoundError if page is out of bounds', async () => {
      prisma.material.count.mockResolvedValue(12);

      await expect(
        service.paginateMaterialByType(Type.Book, { take: 5, page: 5 }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if page is negative', async () => {
      prisma.material.count.mockResolvedValue(12);

      await expect(
        service.paginateMaterialByType(Type.Book, { take: 5, page: -1 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMaterialsWeb', () => {
    it('should paginate all materials for web', async () => {
      prisma.material.count.mockResolvedValue(10);
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.getMaterialsWeb({ take: 5, page: 0 });
      expect(result.Materials).toEqual([mockMaterial]);
      expect(result.Meta.Num_Of_Materials).toBe(10);
    });
  });

  describe('getMaterialsMob', () => {
    it('should return materials using cursor if count exists', async () => {
      prisma.material.findMany
        .mockResolvedValueOnce([{ id: 99 }])
        .mockResolvedValueOnce([mockMaterial]);

      const result = await service.getMaterialsMob({ take: 5 });
      expect(result).toEqual([mockMaterial]);
      expect(prisma.material.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: { id: 99 }, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return material by id', async () => {
      prisma.material.findUnique.mockResolvedValue(mockMaterial);
      const result = await service.findOne(1);
      expect(result).toEqual(mockMaterial);
    });

    it('should return message when material not found', async () => {
      prisma.material.findUnique.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toEqual({ message: 'Material Not Found' });
    });

    it('should throw ConflictError on Prisma P2002', async () => {
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      prisma.material.findUnique.mockRejectedValue(p2002);

      await expect(service.findOne(1)).rejects.toThrow(ConflictError);
    });
  });

  describe('paginateSellerMaterials', () => {
    it('should paginate materials for seller without baseUrl links', async () => {
      prisma.material.count.mockResolvedValue(4);
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.paginateSellerMaterials(10, {
        take: 2,
        page: 0,
      });
      expect(result.Materials).toEqual([mockMaterial]);
      expect(result.Meta.self).toBe(0);
      expect(result.Meta.Links).toBeUndefined();
    });
  });

  describe('findForSeller', () => {
    it('should return materials for seller', async () => {
      prisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.findForSeller(10);
      expect(result).toEqual([mockMaterial]);
    });
  });

  describe('getUserMaterial', () => {
    it('should return purchased user materials', async () => {
      prisma.materialUser.findMany.mockResolvedValue([{ material_id: 1 }]);
      prisma.material.findMany.mockResolvedValue([mockMaterial]);

      const user = { id: 42 } as any;
      const result = await service.getUserMaterial(user);
      expect(result).toEqual([[mockMaterial]]);
    });
  });

  describe('isMaterialPurchased', () => {
    it('should return true if purchased', async () => {
      prisma.materialUser.findFirst.mockResolvedValue({ id: 1 });
      const user = { id: 42 } as any;
      expect(await service.isMaterialPurchased(user, 1)).toBe(true);
    });

    it('should return false if not purchased', async () => {
      prisma.materialUser.findFirst.mockResolvedValue(null);
      const user = { id: 42 } as any;
      expect(await service.isMaterialPurchased(user, 1)).toBe(false);
    });
  });

  describe('getMaterialCoverName & getMaterialPreviewImages', () => {
    it('should get cover name', async () => {
      prisma.materialImage.findFirst.mockResolvedValue({ image: 'cover.png' });
      expect(await service.getMaterialCoverName(1)).toBe('cover.png');
    });

    it('should get preview images', async () => {
      prisma.materialImage.findMany.mockResolvedValue([{ image: 'p1.png' }]);
      expect(await service.getMaterialPreviewImages(1)).toEqual([
        { image: 'p1.png' },
      ]);
    });
  });
});
