import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { User } from '@prisma/client';
import { FavoriteDto } from './dto';

describe('FavoriteController', () => {
  let controller: FavoriteController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    findForUser: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = { id: 'user-1' } as User;
  const mockFavorite = { id: 1, user_id: 'user-1', material_id: 10 };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockFavorite),
      findAll: jest.fn().mockResolvedValue([mockFavorite]),
      findOne: jest.fn().mockResolvedValue(mockFavorite),
      findForUser: jest.fn().mockResolvedValue([mockFavorite]),
      update: jest.fn().mockResolvedValue(mockFavorite),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoriteController],
      providers: [{ provide: FavoriteService, useValue: service }],
    }).compile();

    controller = module.get<FavoriteController>(FavoriteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: FavoriteDto = { material_id: 10 } as any;
    const result = await controller.create(dto, mockUser);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(mockFavorite);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockFavorite]);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockFavorite);
  });

  it('findForUser should call service.findForUser with user_id', async () => {
    const result = await controller.findForUser('user-1');
    expect(service.findForUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([mockFavorite]);
  });

  it('update should call service.update with id and dto', async () => {
    const dto: FavoriteDto = { material_id: 15 } as any;
    const result = await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockFavorite);
  });

  it('remove should call service.remove with numeric id', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted' });
  });
});
