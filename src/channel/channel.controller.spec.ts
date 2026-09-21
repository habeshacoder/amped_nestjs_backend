import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { ChannelDto } from './dto';

describe('ChannelController', () => {
  let controller: ChannelController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    paginateChannels: jest.Mock;
    findOne: jest.Mock;
    getMyChannels: jest.Mock;
    newChannels: jest.Mock;
    findForSeller: jest.Mock;
    findDraftForSeller: jest.Mock;
    update: jest.Mock;
    updateChannelProfileImage: jest.Mock;
    updateChannelCoverImage: jest.Mock;
    remove: jest.Mock;
    showChannelProfile: jest.Mock;
    showChannelCover: jest.Mock;
    uploadChannelImage: jest.Mock;
    showChannelImage: jest.Mock;
    getChannelCoverImageName: jest.Mock;
    uploadChannelPreview: jest.Mock;
    showChannelPreview: jest.Mock;
  };

  const mockChannel = { id: 1, name: 'Tech Channel' };
  const mockRes = {
    sendFile: jest.fn(),
  } as any;

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockChannel),
      findAll: jest.fn().mockResolvedValue([mockChannel]),
      paginateChannels: jest
        .fn()
        .mockResolvedValue({ channels: [mockChannel] }),
      findOne: jest.fn().mockResolvedValue(mockChannel),
      getMyChannels: jest.fn().mockResolvedValue([mockChannel]),
      newChannels: jest.fn().mockResolvedValue([mockChannel]),
      findForSeller: jest.fn().mockResolvedValue([mockChannel]),
      findDraftForSeller: jest.fn().mockResolvedValue([mockChannel]),
      update: jest.fn().mockResolvedValue(mockChannel),
      updateChannelProfileImage: jest
        .fn()
        .mockResolvedValue({ message: 'Success' }),
      updateChannelCoverImage: jest
        .fn()
        .mockResolvedValue({ message: 'Success' }),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
      showChannelProfile: jest.fn().mockResolvedValue(undefined),
      showChannelCover: jest.fn().mockResolvedValue(undefined),
      uploadChannelImage: jest.fn().mockResolvedValue([mockChannel]),
      showChannelImage: jest.fn().mockResolvedValue(undefined),
      getChannelCoverImageName: jest.fn().mockResolvedValue('cover.jpg'),
      uploadChannelPreview: jest.fn().mockResolvedValue({ id: 1 }),
      showChannelPreview: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [{ provide: ChannelService, useValue: service }],
    }).compile();

    controller = module.get<ChannelController>(ChannelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: ChannelDto = { name: 'Tech', description: 'Desc' } as any;
    const files = {} as any;
    const result = await controller.create(files, dto);
    expect(service.create).toHaveBeenCalledWith(files, dto);
    expect(result).toEqual(mockChannel);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockChannel]);
  });

  it('paginateChannels should call service.paginateChannels with numbers', async () => {
    const result = await controller.paginateChannels('10', '1');
    expect(service.paginateChannels).toHaveBeenCalledWith({
      take: 10,
      page: 1,
    });
    expect(result).toEqual({ channels: [mockChannel] });
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockChannel);
  });

  it('findMyChannel should call service.getMyChannels', async () => {
    const result = await controller.findMyChannel('5');
    expect(service.getMyChannels).toHaveBeenCalledWith(5);
    expect(result).toEqual([mockChannel]);
  });

  it('getNewChannels should call service.newChannels', async () => {
    const result = await controller.getNewChannels();
    expect(service.newChannels).toHaveBeenCalled();
    expect(result).toEqual([mockChannel]);
  });

  it('findForSeller should call service.findForSeller', async () => {
    const result = await controller.findForSeller('3');
    expect(service.findForSeller).toHaveBeenCalledWith(3);
    expect(result).toEqual([mockChannel]);
  });

  it('findDraftForSeller should call service.findDraftForSeller', async () => {
    const result = await controller.findDraftForSeller('3');
    expect(service.findDraftForSeller).toHaveBeenCalledWith(3);
    expect(result).toEqual([mockChannel]);
  });

  it('update should call service.update', async () => {
    const dto: ChannelDto = { name: 'Updated' } as any;
    const result = await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockChannel);
  });

  it('updateChannelProfileImage should call service.updateChannelProfileImage', async () => {
    const files = {} as any;
    const result = await controller.updateChannelProfileImage(files, '1');
    expect(service.updateChannelProfileImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual({ message: 'Success' });
  });

  it('updateChannelCoverImage should call service.updateChannelCoverImage', async () => {
    const files = {} as any;
    const result = await controller.updateChannelCoverImage(files, '1');
    expect(service.updateChannelCoverImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual({ message: 'Success' });
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted' });
  });

  it('removeAdmin should call service.remove', async () => {
    const result = await controller.removeAdmin('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Deleted' });
  });

  it('findChannelProfile should delegate to service.showChannelProfile', async () => {
    await controller.findChannelProfile('1', mockRes);
    expect(service.showChannelProfile).toHaveBeenCalledWith(1, mockRes);
  });

  it('findProfileImage should send file from disk', () => {
    controller.findProfileImage('avatar.png', mockRes);
    expect(mockRes.sendFile).toHaveBeenCalledWith(
      expect.stringContaining('avatar.png'),
    );
  });

  it('findChannelCover should delegate to service.showChannelCover', async () => {
    await controller.findChannelCover('1', mockRes);
    expect(service.showChannelCover).toHaveBeenCalledWith(1, mockRes);
  });

  it('uploadFile should call service.uploadChannelImage', async () => {
    const files = [] as any;
    const result = await controller.uploadFile(files, '1');
    expect(service.uploadChannelImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual([mockChannel]);
  });

  it('findChannelImage should delegate to service.showChannelImage', async () => {
    await controller.findChannelImage('1', mockRes);
    expect(service.showChannelImage).toHaveBeenCalledWith(1, mockRes);
  });

  it('getChannelCoverImage should call service.getChannelCoverImageName', async () => {
    const result = await controller.getChannelCoverImage('1');
    expect(service.getChannelCoverImageName).toHaveBeenCalledWith(1);
    expect(result).toBe('cover.jpg');
  });

  it('createChannelPreview should call service.uploadChannelPreview', async () => {
    const file = {} as any;
    const result = await controller.createChannelPreview(file, '1');
    expect(service.uploadChannelPreview).toHaveBeenCalledWith(file, 1);
    expect(result).toEqual({ id: 1 });
  });

  it('findChannelPreview should delegate to service.showChannelPreview', async () => {
    await controller.findChannelPreview('1', mockRes);
    expect(service.showChannelPreview).toHaveBeenCalledWith(1, mockRes);
  });
});
