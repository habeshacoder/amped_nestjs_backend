import { Test, TestingModule } from '@nestjs/testing';
import { SocialLinksProfileController } from './social-links-profile.controller';
import { SocialLinksProfileService } from './social-links-profile.service';
import { SocialLinksProfileDto } from './dto';

describe('SocialLinksProfileController', () => {
  let controller: SocialLinksProfileController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    getSellerSocialLinks: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockLink = { id: 1, seller_profile_id: 2, url: 'https://twitter.com' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockLink),
      findAll: jest.fn().mockResolvedValue([mockLink]),
      findOne: jest.fn().mockResolvedValue(mockLink),
      getSellerSocialLinks: jest.fn().mockResolvedValue([mockLink]),
      update: jest.fn().mockResolvedValue(mockLink),
      remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialLinksProfileController],
      providers: [{ provide: SocialLinksProfileService, useValue: service }],
    }).compile();

    controller = module.get<SocialLinksProfileController>(
      SocialLinksProfileController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto: SocialLinksProfileDto = { url: 'https://twitter.com' } as any;
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

  it('getSellerSocialLinks should call service.getSellerSocialLinks', async () => {
    const result = await controller.getSellerSocialLinks('2');
    expect(service.getSellerSocialLinks).toHaveBeenCalledWith(2);
    expect(result).toEqual([mockLink]);
  });

  it('update should call service.update', async () => {
    const dto: SocialLinksProfileDto = { url: 'https://fb.com' } as any;
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
