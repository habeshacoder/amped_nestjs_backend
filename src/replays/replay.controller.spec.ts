import { Test, TestingModule } from '@nestjs/testing';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';
import { ReplayDto } from './dto/replay.dto';
import { UpdateReplayDto } from './dto/update-replay.dto';

describe('ReplayController', () => {
  let controller: ReplayController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByRemarkId: jest.Mock;
    replayForRemark: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockReplay = { id: 1, remark_id: 10, content: 'Replay text' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockReplay),
      findAll: jest.fn().mockResolvedValue([mockReplay]),
      findOne: jest.fn().mockResolvedValue(mockReplay),
      findByRemarkId: jest.fn().mockResolvedValue([mockReplay]),
      replayForRemark: jest.fn().mockResolvedValue([mockReplay]),
      update: jest.fn().mockResolvedValue(mockReplay),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplayController],
      providers: [{ provide: ReplayService, useValue: service }],
    }).compile();

    controller = module.get<ReplayController>(ReplayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: ReplayDto = { remark_id: 10, content: 'Replay text' } as any;
    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockReplay);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockReplay]);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockReplay);
  });

  it('checkReplayByRemarkId should call service.findByRemarkId', async () => {
    const result = await controller.checkReplayByRemarkId('10');
    expect(service.findByRemarkId).toHaveBeenCalledWith(10);
    expect(result).toEqual([mockReplay]);
  });

  it('findByRemarkId should call service.findByRemarkId', async () => {
    const result = await controller.findByRemarkId('10');
    expect(service.findByRemarkId).toHaveBeenCalledWith(10);
    expect(result).toEqual([mockReplay]);
  });

  it('replayForRemark should call service.replayForRemark', async () => {
    const result = await controller.replayForRemark('10');
    expect(service.replayForRemark).toHaveBeenCalledWith(10);
    expect(result).toEqual([mockReplay]);
  });

  it('update should call service.update', async () => {
    const dto: UpdateReplayDto = { content: 'Updated' } as any;
    const result = await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockReplay);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted' });
  });
});
