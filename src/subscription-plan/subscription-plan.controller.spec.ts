import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanController } from './subscription-plan.controller';
import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanDto, UpdateDto } from './dto';

describe('SubscriptionPlanController', () => {
  let controller: SubscriptionPlanController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    getMaterialsInSubPlan: jest.Mock;
    findForChannel: jest.Mock;
    findForSeller: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockPlan = { id: 1, name: 'Premium Plan', price: 100 };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockPlan),
      findAll: jest.fn().mockResolvedValue([mockPlan]),
      findOne: jest.fn().mockResolvedValue(mockPlan),
      getMaterialsInSubPlan: jest.fn().mockResolvedValue([]),
      findForChannel: jest.fn().mockResolvedValue([mockPlan]),
      findForSeller: jest.fn().mockResolvedValue([mockPlan]),
      update: jest.fn().mockResolvedValue(mockPlan),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted plan' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionPlanController],
      providers: [{ provide: SubscriptionPlanService, useValue: service }],
    }).compile();

    controller = module.get<SubscriptionPlanController>(
      SubscriptionPlanController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: SubscriptionPlanDto = { name: 'Plan' } as any;
    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockPlan);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockPlan]);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockPlan);
  });

  it('getMaterialsInSubPlan should call service.getMaterialsInSubPlan', async () => {
    const result = await controller.getMaterialsInSubPlan('1');
    expect(service.getMaterialsInSubPlan).toHaveBeenCalledWith(1);
    expect(result).toEqual([]);
  });

  it('findForChannel should call service.findForChannel', async () => {
    const result = await controller.findForChannel('5');
    expect(service.findForChannel).toHaveBeenCalledWith(5);
    expect(result).toEqual([mockPlan]);
  });

  it('findForSeller should call service.findForSeller', async () => {
    const result = await controller.findForSeller('3');
    expect(service.findForSeller).toHaveBeenCalledWith(3);
    expect(result).toEqual([mockPlan]);
  });

  it('update should call service.update', async () => {
    const dto: UpdateDto = { name: 'Updated Plan' } as any;
    const result = await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockPlan);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted plan' });
  });
});
