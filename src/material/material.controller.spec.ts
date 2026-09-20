import { Test, TestingModule } from '@nestjs/testing';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';
import { Type, Parent } from '@prisma/client';

describe('MaterialController', () => {
  let controller: MaterialController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    getMaterialsWeb: jest.Mock;
    paginateMaterialByType: jest.Mock;
    getMaterialByType: jest.Mock;
    getMaterialsMob: jest.Mock;
  };

  const mockMaterial = {
    id: 1,
    title: 'Test Material',
    description: 'Test Description',
    type: Type.Book,
    parent: Parent.Publication,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getMaterialsWeb: jest.fn(),
      paginateMaterialByType: jest.fn(),
      getMaterialByType: jest.fn(),
      getMaterialsMob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialController],
      providers: [{ provide: MaterialService, useValue: service }],
    }).compile();

    controller = module.get<MaterialController>(MaterialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create material using DTO', async () => {
      service.create.mockResolvedValue(mockMaterial);
      const dto = {
        title: 'Test Material',
        sellerProfile_id: 1,
        type: Type.Book,
        parent: Parent.Publication,
      } as any;

      const result = await controller.create(dto);
      expect(result).toEqual(mockMaterial);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all materials', async () => {
      service.findAll.mockResolvedValue([mockMaterial]);

      const result = await controller.findAll();
      expect(result).toEqual([mockMaterial]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a material by numeric id', async () => {
      service.findOne.mockResolvedValue(mockMaterial);

      const result = await controller.findOne(1);
      expect(result).toEqual(mockMaterial);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update material with partial DTO', async () => {
      service.update.mockResolvedValue({ ...mockMaterial, title: 'Updated' });

      const result = await controller.update(1, { title: 'Updated' });
      expect(result.title).toBe('Updated');
      expect(service.update).toHaveBeenCalledWith(1, { title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should remove material', async () => {
      service.remove.mockResolvedValue({
        message: 'Material deleted successfully',
      });

      const result = await controller.remove(1);
      expect(result).toEqual({ message: 'Material deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('getMaterialsWeb', () => {
    it('should pass pagination DTO to service', async () => {
      service.getMaterialsWeb.mockResolvedValue({
        Materials: [mockMaterial],
        Meta: {},
      });

      const result = await controller.getMaterialsWeb({ take: 10, page: 0 });
      expect(service.getMaterialsWeb).toHaveBeenCalledWith({
        take: 10,
        page: 0,
      });
      expect(result.Materials).toEqual([mockMaterial]);
    });
  });

  describe('paginateMaterialByType', () => {
    it('should pass type and pagination DTO to service', async () => {
      service.paginateMaterialByType.mockResolvedValue({
        Materials: [mockMaterial],
        Meta: {},
      });

      const result = await controller.paginateMaterialByType(Type.Book, {
        take: 5,
        page: 1,
      });
      expect(service.paginateMaterialByType).toHaveBeenCalledWith(Type.Book, {
        take: 5,
        page: 1,
      });
      expect(result.Materials).toEqual([mockMaterial]);
    });
  });
});
