import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { User } from '@prisma/client';
import { ProfileDto, UpdateDto } from './dto';
import { Response } from 'express';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findMe: jest.Mock;
    findOne: jest.Mock;
    findProfileByUserId: jest.Mock;
    updatePassword: jest.Mock;
    updateProfile: jest.Mock;
    updateProfileImage: jest.Mock;
    updateCoverImage: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = { id: 'user-1' } as User;
  const mockProfile = { id: 1, user_id: 'user-1', name: 'Test User' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockProfile),
      findAll: jest.fn().mockResolvedValue([mockProfile]),
      findMe: jest.fn().mockResolvedValue(mockProfile),
      findOne: jest.fn().mockResolvedValue(mockProfile),
      findProfileByUserId: jest.fn().mockResolvedValue(mockProfile),
      updatePassword: jest
        .fn()
        .mockResolvedValue({ message: 'Password updated' }),
      updateProfile: jest.fn().mockResolvedValue(mockProfile),
      updateProfileImage: jest.fn().mockResolvedValue(mockProfile),
      updateCoverImage: jest.fn().mockResolvedValue(mockProfile),
      remove: jest.fn().mockResolvedValue({ message: 'Profile deleted' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [{ provide: ProfilesService, useValue: service }],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const files = {
      profile: { filename: 'p.png' } as Express.Multer.File,
      cover: { filename: 'c.png' } as Express.Multer.File,
    };
    const dto: ProfileDto = { first_name: 'John', last_name: 'Doe' } as any;
    const result = await controller.create(files, dto, mockUser);
    expect(service.create).toHaveBeenCalledWith(files, dto, mockUser);
    expect(result).toEqual(mockProfile);
  });

  it('findAll should call service.findAll', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockProfile]);
  });

  it('findMe should call service.findMe with current user', async () => {
    const result = await controller.findMe(mockUser);
    expect(service.findMe).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockProfile);
  });

  it('findOne should call service.findOne with numeric id', async () => {
    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockProfile);
  });

  it('findUserProfileByUserId should call service.findProfileByUserId', async () => {
    const result = await controller.findUserProfileByUserId('user-1');
    expect(service.findProfileByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockProfile);
  });

  it('updatePassword should call service.updatePassword', async () => {
    const dto: UpdateDto = { old_password: 'old', new_password: 'new' } as any;
    const result = await controller.updatePassword(dto, mockUser);
    expect(service.updatePassword).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual({ message: 'Password updated' });
  });

  it('updateProfileInfo should call service.updateProfile', async () => {
    const dto: ProfileDto = { first_name: 'Jane' } as any;
    const result = await controller.updateProfileInfo('1', dto);
    expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(mockProfile);
  });

  it('updateProfileImage should call service.updateProfileImage', async () => {
    const files = { profile: { filename: 'p2.png' } as Express.Multer.File };
    const result = await controller.updateProfileImage(files, '1');
    expect(service.updateProfileImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual(mockProfile);
  });

  it('updateCoverImage should call service.updateCoverImage', async () => {
    const files = { cover: { filename: 'c2.png' } as Express.Multer.File };
    const result = await controller.updateCoverImage(files, '1');
    expect(service.updateCoverImage).toHaveBeenCalledWith(files, 1);
    expect(result).toEqual(mockProfile);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Profile deleted' });
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
