import { Test, TestingModule } from '@nestjs/testing';
import { SocialLinksChannelController } from './social-links-channel.controller';
import { SocialLinksChannelService } from './social-links-channel.service';
import { SocialLinksChannelDto } from './dto';

describe('SocialLinksChannelController', () => {
  let controller: SocialLinksChannelController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockLink = { id: 1, channel_id: 2, url: 'https://youtube.com' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockLink),
      findAll: jest.fn().mockResolvedValue([mockLink]),
      findOne: jest.fn().mockResolvedValue(mockLink),
      update: jest.fn().mockResolvedValue(mockLink),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialLinksChannelController],
      providers: [{ provide: SocialLinksChannelService, useValue: service }],
    }).compile();

    controller = module.get<SocialLinksChannelController>(
      SocialLinksChannelController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: SocialLinksChannelDto = { url: 'https://youtube.com' } as any;
    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockLink);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockLink]);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockLink);
  });

  it('findForChannel should call service.findOne with numeric id', async () => {
    const result = await controller.findForChannel('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockLink);
  });

  it('update should call service.update', async () => {
    const dto: SocialLinksChannelDto = { url: 'https://vimeo.com' } as any;
    const result = await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockLink);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted' });
  });
});
