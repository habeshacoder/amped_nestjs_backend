import { Test, TestingModule } from '@nestjs/testing';
import { SebscribedUserController } from './subscribed-user.controller';
import { SubscribedUserService } from './subscribed-user.service';
import { User } from '@prisma/client';
import { SubscribedUserDto, UpdateSubscribedUserDto } from './dto';

describe('SebscribedUserController', () => {
  let controller: SebscribedUserController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = { id: 'user-1' } as User;
  const mockSubscribedUser = { id: 1, user_id: 'user-1', plan_id: 10 };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockSubscribedUser),
      findAll: jest.fn().mockResolvedValue([mockSubscribedUser]),
      findOne: jest.fn().mockResolvedValue(mockSubscribedUser),
      update: jest.fn().mockResolvedValue(mockSubscribedUser),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SebscribedUserController],
      providers: [{ provide: SubscribedUserService, useValue: service }],
    }).compile();

    controller = module.get<SebscribedUserController>(SebscribedUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: SubscribedUserDto = { plan_id: 10 } as any;
    const result = await controller.create(dto, mockUser);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(mockSubscribedUser);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockSubscribedUser]);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockSubscribedUser);
  });

  it('update should call service.update', async () => {
    const dto: UpdateSubscribedUserDto = { is_active: false } as any;
    const result = await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockSubscribedUser);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted' });
  });
});
