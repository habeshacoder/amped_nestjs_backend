import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportType, User } from '@prisma/client';
import { ReportDto } from './dto';

describe('ReportController', () => {
  let controller: ReportController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByReportType: jest.Mock;
    reportsOnMaterial: jest.Mock;
    reportsOnChannel: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = { id: 'user-1' } as User;
  const mockReport = {
    id: 1,
    user_id: 'user-1',
    report_type: ReportType.HateSpeech,
    report_desc: 'Inappropriate content',
    material_id: 10,
    channel_id: null,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByReportType: jest.fn(),
      reportsOnMaterial: jest.fn(),
      reportsOnChannel: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: service }],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and user', async () => {
      const dto: ReportDto = {
        report_type: ReportType.HateSpeech,
        report_desc: 'Inappropriate content',
        material_id: 10,
      } as any;
      service.create.mockResolvedValue(mockReport);

      const result = await controller.create(dto, mockUser);
      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockReport);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      service.findAll.mockResolvedValue([mockReport]);

      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockReport]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with numeric id', async () => {
      service.findOne.mockResolvedValue(mockReport);

      const result = await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReport);
    });
  });

  describe('findByReportType', () => {
    it('should call service.findByReportType with report type', async () => {
      service.findByReportType.mockResolvedValue([mockReport]);

      const result = await controller.findByReportType(ReportType.HateSpeech);
      expect(service.findByReportType).toHaveBeenCalledWith(
        ReportType.HateSpeech,
      );
      expect(result).toEqual([mockReport]);
    });
  });

  describe('reportsOnMaterial', () => {
    it('should call service.reportsOnMaterial with numeric material_id', async () => {
      service.reportsOnMaterial.mockResolvedValue([mockReport]);

      const result = await controller.reportsOnMaterial('10');
      expect(service.reportsOnMaterial).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockReport]);
    });
  });

  describe('reportsOnChannel', () => {
    it('should call service.reportsOnChannel with numeric channel_id', async () => {
      service.reportsOnChannel.mockResolvedValue([mockReport]);

      const result = await controller.reportsOnChannel('20');
      expect(service.reportsOnChannel).toHaveBeenCalledWith(20);
      expect(result).toEqual([mockReport]);
    });
  });

  describe('remove', () => {
    it('should call service.remove with numeric id', async () => {
      const success = { message: 'Report deleted successfully' };
      service.remove.mockResolvedValue(success);

      const result = await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(success);
    });
  });
});
