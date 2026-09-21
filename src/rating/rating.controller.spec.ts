import { Test, TestingModule } from '@nestjs/testing';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { User } from '@prisma/client';
import { RatingDto } from './dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

describe('RatingController', () => {
  let controller: RatingController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    getMyReview: jest.Mock;
    getByRatingNo: jest.Mock;
    findOne: jest.Mock;
    getMyMaterialReview: jest.Mock;
    getMyChannelReview: jest.Mock;
    materialRating: jest.Mock;
    channelRating: jest.Mock;
    noOfMaterialRating: jest.Mock;
    noOfChannelRating: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = { id: 'user-1' } as User;
  const mockRating = {
    id: 1,
    rating: 5,
    remark: 'Excellent',
    user_id: 'user-1',
    material_id: 10,
    channel_id: null,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      getMyReview: jest.fn(),
      getByRatingNo: jest.fn(),
      findOne: jest.fn(),
      getMyMaterialReview: jest.fn(),
      getMyChannelReview: jest.fn(),
      materialRating: jest.fn(),
      channelRating: jest.fn(),
      noOfMaterialRating: jest.fn(),
      noOfChannelRating: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingController],
      providers: [{ provide: RatingService, useValue: service }],
    }).compile();

    controller = module.get<RatingController>(RatingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and user', async () => {
      const dto: RatingDto = {
        rating: 5,
        remark: 'Great',
        material_id: 10,
      } as any;
      service.create.mockResolvedValue(mockRating);

      const result = await controller.create(dto, mockUser);
      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockRating);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      service.findAll.mockResolvedValue([mockRating]);

      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockRating]);
    });
  });

  describe('myReview', () => {
    it('should call service.getMyReview with user', async () => {
      service.getMyReview.mockResolvedValue([mockRating]);

      const result = await controller.myReview(mockUser);
      expect(service.getMyReview).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual([mockRating]);
    });
  });

  describe('getByRatingNo', () => {
    it('should call service.getByRatingNo with user and numeric rating', async () => {
      service.getByRatingNo.mockResolvedValue([mockRating]);

      const result = await controller.getByRatingNo(mockUser, '5');
      expect(service.getByRatingNo).toHaveBeenCalledWith(mockUser, 5);
      expect(result).toEqual([mockRating]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with numeric id', async () => {
      service.findOne.mockResolvedValue(mockRating);

      const result = await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRating);
    });
  });

  describe('myMaterialReview', () => {
    it('should call service.getMyMaterialReview with material id and user', async () => {
      service.getMyMaterialReview.mockResolvedValue(mockRating);

      const result = await controller.myMaterialReview('10', mockUser);
      expect(service.getMyMaterialReview).toHaveBeenCalledWith(10, mockUser);
      expect(result).toEqual(mockRating);
    });
  });

  describe('myChannelReview', () => {
    it('should call service.getMyChannelReview with channel id and user', async () => {
      service.getMyChannelReview.mockResolvedValue(mockRating);

      const result = await controller.myChannelReview('20', mockUser);
      expect(service.getMyChannelReview).toHaveBeenCalledWith(20, mockUser);
      expect(result).toEqual(mockRating);
    });
  });

  describe('materialRating', () => {
    it('should call service.materialRating with material id', async () => {
      const summary = { rating: 4.5, rate: [mockRating] };
      service.materialRating.mockResolvedValue(summary);

      const result = await controller.materialRating('10');
      expect(service.materialRating).toHaveBeenCalledWith(10);
      expect(result).toEqual(summary);
    });
  });

  describe('channelRating', () => {
    it('should call service.channelRating with channel id', async () => {
      const summary = { rating: 4.5, rate: [mockRating] };
      service.channelRating.mockResolvedValue(summary);

      const result = await controller.channelRating('20');
      expect(service.channelRating).toHaveBeenCalledWith(20);
      expect(result).toEqual(summary);
    });
  });

  describe('noOfMaterialRating', () => {
    it('should call service.noOfMaterialRating with query params', async () => {
      service.noOfMaterialRating.mockResolvedValue(5);

      const result = await controller.noOfMaterialRating('5', '10');
      expect(service.noOfMaterialRating).toHaveBeenCalledWith({
        rating: 5,
        material_id: 10,
      });
      expect(result).toBe(5);
    });
  });

  describe('noOfChannelRating', () => {
    it('should call service.noOfChannelRating with query params', async () => {
      service.noOfChannelRating.mockResolvedValue(3);

      const result = await controller.noOfChannelRating('4', '20');
      expect(service.noOfChannelRating).toHaveBeenCalledWith({
        rating: 4,
        channel_id: 20,
      });
      expect(result).toBe(3);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const updateDto: UpdateRatingDto = { rating: 4, remark: 'Updated' };
      service.update.mockResolvedValue({ ...mockRating, rating: 4 });

      const result = await controller.update('1', updateDto);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({ ...mockRating, rating: 4 });
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const success = { message: 'Rate deleted successfully' };
      service.remove.mockResolvedValue(success);

      const result = await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(success);
    });
  });
});
