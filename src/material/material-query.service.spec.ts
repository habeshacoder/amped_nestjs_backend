import { Test, TestingModule } from '@nestjs/testing';
import { MaterialQueryService } from './material-query.service';
import { MaterialRepository } from './material.repository';
import { Parent, Type } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  ConflictError,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';
import { MATERIAL_INCLUDE } from './material-query.constants';

describe('MaterialQueryService', () => {
  let service: MaterialQueryService;
  let repo: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    findMaterialUsers: jest.Mock;
    findFirstMaterialUser: jest.Mock;
    findMaterialImages: jest.Mock;
    findFirstMaterialImage: jest.Mock;
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
    repo = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findMaterialUsers: jest.fn(),
      findFirstMaterialUser: jest.fn(),
      findMaterialImages: jest.fn(),
      findFirstMaterialImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialQueryService,
        { provide: MaterialRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<MaterialQueryService>(MaterialQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all materials ordered by id asc', async () => {
      repo.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.findAll();
      expect(result).toEqual([mockMaterial]);
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { id: 'asc' } }),
      );
    });
  });

  describe('getHomeItems', () => {
    it('should query top 10 materials ordered by id desc with relations', async () => {
      repo.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.getHomeItems();

      expect(result).toEqual([mockMaterial]);
      expect(repo.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { id: 'desc' },
        include: {
          ...MATERIAL_INCLUDE,
          SellerProfile: true,
        },
      });
    });
  });

  describe('getMaterialByType', () => {
    it('should return up to 3 materials', async () => {
      repo.findMany.mockResolvedValue([
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
      repo.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.getMaterialByParent(Parent.Publication);
      expect(result).toEqual([mockMaterial]);
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parent: Parent.Publication } }),
      );
    });
  });

  describe('getMaterialByPublicationYear', () => {
    it('should return materials by publication year', async () => {
      repo.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.getMaterialByPublicationYear('2023');
      expect(result).toEqual([mockMaterial]);
    });
  });

  describe('paginateMaterialByType', () => {
    it('should return paginated materials for first page', async () => {
      repo.count.mockResolvedValue(12);
      repo.findMany.mockResolvedValue([mockMaterial]);

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
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
          where: { type: Type.Book },
        }),
      );
    });

    it('should calculate skip and pagination links correctly for middle page', async () => {
      repo.count.mockResolvedValue(12);
      repo.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 1,
      });
      expect(result.Meta.self).toBe(1);
      expect(result.Meta.prev).toBe(0);
      expect(result.Meta.next).toBe(2);
      expect(result.Meta.last).toBe(2);
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should set next to null on last page', async () => {
      repo.count.mockResolvedValue(12);
      repo.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 2,
      });
      expect(result.Meta.self).toBe(2);
      expect(result.Meta.prev).toBe(1);
      expect(result.Meta.next).toBeNull();
      expect(result.Meta.last).toBe(2);
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should handle count === 0 when page === 0', async () => {
      repo.count.mockResolvedValue(0);
      repo.findMany.mockResolvedValue([]);

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
      repo.count.mockResolvedValue(12);

      await expect(
        service.paginateMaterialByType(Type.Book, { take: 5, page: 5 }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if page is negative', async () => {
      repo.count.mockResolvedValue(12);

      await expect(
        service.paginateMaterialByType(Type.Book, { take: 5, page: -1 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMaterialsWeb', () => {
    it('should paginate all materials for web', async () => {
      repo.count.mockResolvedValue(10);
      repo.findMany.mockResolvedValue([mockMaterial]);

      const result = await service.getMaterialsWeb({ take: 5, page: 0 });
      expect(result.Materials).toEqual([mockMaterial]);
      expect(result.Meta.Num_Of_Materials).toBe(10);
    });
  });

  describe('getMaterialsMob', () => {
    it('should return materials using cursor if count exists', async () => {
      repo.findMany
        .mockResolvedValueOnce([{ id: 99 }])
        .mockResolvedValueOnce([mockMaterial]);

      const result = await service.getMaterialsMob({ take: 5 });
      expect(result).toEqual([mockMaterial]);
      expect(repo.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: { id: 99 }, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return material by id', async () => {
      repo.findUnique.mockResolvedValue(mockMaterial);
      const result = await service.findOne(1);
      expect(result).toEqual(mockMaterial);
    });

    it('should return message when material not found', async () => {
      repo.findUnique.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toEqual({ message: 'Material Not Found' });
    });

    it('should throw ConflictError on Prisma P2002', async () => {
      const p2002 = new PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '4.16.2',
      });
      repo.findUnique.mockRejectedValue(p2002);

      await expect(service.findOne(1)).rejects.toThrow(ConflictError);
    });
  });

  describe('paginateSellerMaterials', () => {
    it('should paginate materials for seller without baseUrl links', async () => {
      repo.count.mockResolvedValue(4);
      repo.findMany.mockResolvedValue([mockMaterial]);

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
      repo.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.findForSeller(10);
      expect(result).toEqual([mockMaterial]);
    });
  });

  describe('getUserMaterial', () => {
    it('should return purchased user materials', async () => {
      repo.findMaterialUsers.mockResolvedValue([{ material_id: 1 }]);
      repo.findMany.mockResolvedValue([mockMaterial]);

      const user = { id: 42 } as any;
      const result = await service.getUserMaterial(user);
      expect(result).toEqual([[mockMaterial]]);
    });
  });

  describe('isMaterialPurchased', () => {
    it('should return true if purchased', async () => {
      repo.findFirstMaterialUser.mockResolvedValue({ id: 1 });
      const user = { id: 42 } as any;
      expect(await service.isMaterialPurchased(user, 1)).toBe(true);
    });

    it('should return false if not purchased', async () => {
      repo.findFirstMaterialUser.mockResolvedValue(null);
      const user = { id: 42 } as any;
      expect(await service.isMaterialPurchased(user, 1)).toBe(false);
    });
  });

  describe('getMaterialCoverName & getMaterialPreviewImages', () => {
    it('should get cover name', async () => {
      repo.findFirstMaterialImage.mockResolvedValue({ image: 'cover.png' });
      expect(await service.getMaterialCoverName(1)).toBe('cover.png');
    });

    it('should get preview images', async () => {
      repo.findMaterialImages.mockResolvedValue([{ image: 'p1.png' }]);
      expect(await service.getMaterialPreviewImages(1)).toEqual([
        { image: 'p1.png' },
      ]);
    });
  });
});
