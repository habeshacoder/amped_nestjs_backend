import { Test, TestingModule } from '@nestjs/testing';
import { SellerProfilesController } from './seller-profiles.controller';
import { SellerProfilesService } from './seller-profiles.service';
import { User } from '@prisma/client';
import { SellerProfileDto } from './dto';
import { Response } from 'express';

describe('SellerProfilesController', () => {
  let controller: SellerProfilesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findMe: jest.Mock;
    findOne: jest.Mock;
    updateProfileInfo: jest.Mock;
    updateProfileImage: jest.Mock;
    updateCoverImage: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = { id: 'user-1' } as User;
  const mockSellerProfile = { id: 1, user_id: 'user-1', name: 'Seller 1' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockSellerProfile),
      findAll: jest.fn().mockResolvedValue([mockSellerProfile]),
      findMe: jest.fn().mockResolvedValue(mockSellerProfile),
      findOne: jest.fn().mockResolvedValue(mockSellerProfile),
      updateProfileInfo: jest.fn().mockResolvedValue(mockSellerProfile),
      updateProfileImage: jest.fn().mockResolvedValue(mockSellerProfile),
      updateCoverImage: jest.fn().mockResolvedValue(mockSellerProfile),
      remove: jest
        .fn()
        .mockResolvedValue({ message: 'Seller profile deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerProfilesController],
      providers: [{ provide: SellerProfilesService, useValue: service }],
    }).compile();

    controller = module.get<SellerProfilesController>(SellerProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const files = {
      image: { filename: 'img.png' } as Express.Multer.File,
      cover: { filename: 'cov.png' } as Express.Multer.File,
    };
    const dto: SellerProfileDto = { name: 'Seller Store' } as any;
    const result = await controller.create(files, dto, mockUser);
    expect(service.create).toHaveBeenCalledWith(files, dto, mockUser);
    expect(result).toEqual(mockSellerProfile);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockSellerProfile]);
  });

  it('findMe should call service.findMe with current user', async () => {
    const result = await controller.findMe(mockUser);
    expect(service.findMe).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockSellerProfile);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockSellerProfile);
  });

  it('updateSellerInfo should call service.updateProfileInfo', async () => {
    const dto: SellerProfileDto = { name: 'New Name' } as any;
    const result = await controller.updateSellerInfo('1', dto);
    expect(service.updateProfileInfo).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockSellerProfile);
  });

  it('updateProfileImage should call service.updateProfileImage', async () => {
    const files = { image: { filename: 'new.png' } as Express.Multer.File };
    const result = await controller.updateProfileImage(files, '1');
    expect(service.updateProfileImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual(mockSellerProfile);
  });

  it('updateCoverImage should call service.updateCoverImage', async () => {
    const files = { cover: { filename: 'newcov.png' } as Express.Multer.File };
    const result = await controller.updateCoverImage(files, '1');
    expect(service.updateCoverImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual(mockSellerProfile);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Seller profile deleted' });
  });

  it('findProfileImage should send file through response', () => {
    const res = { sendFile: jest.fn() } as unknown as Response;
    controller.findProfileImage('avatar.png', res);
    expect(res.sendFile).toHaveBeenCalled();
  });

  it('findCoverImage should send file through response', () => {
    const res = { sendFile: jest.fn() } as unknown as Response;
    controller.findCoverImage('cover.png', res);
    expect(res.sendFile).toHaveBeenCalled();
  });
});
