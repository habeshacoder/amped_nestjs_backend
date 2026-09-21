import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { ReportType, User } from '@prisma/client';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: {
    report: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  } as User;

  const mockReport = {
    id: 1,
    user_id: 'user-1',
    report_type: ReportType.HateSpeech,
    report_desc: 'Spam content',
    material_id: 10,
    channel_id: null as number | null,
  };

  beforeEach(async () => {
    prisma = {
      report: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report on a material successfully', async () => {
      prisma.report.findFirst.mockResolvedValue(null);
      prisma.report.create.mockResolvedValue(mockReport);

      const dto = {
        report_type: ReportType.HateSpeech,
        report_desc: 'Spam description',
        material_id: 10,
        channel_id: undefined as number | undefined,
      };

      const result = await service.create(dto as any, mockUser);
      expect(result).toEqual(mockReport);
      expect(prisma.report.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException if report already exists for user and target', async () => {
      prisma.report.findFirst.mockResolvedValue(mockReport);

      const dto = {
        report_type: ReportType.HateSpeech,
        report_desc: 'Spam description',
        material_id: 10,
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if both material_id and channel_id are present', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      const dto = {
        report_type: ReportType.HateSpeech,
        report_desc: 'Spam description',
        material_id: 10,
        channel_id: 20,
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create a report on a channel successfully', async () => {
      prisma.report.findFirst.mockResolvedValue(null);
      prisma.report.create.mockResolvedValue({
        ...mockReport,
        material_id: null,
        channel_id: 20,
      });

      const dto = {
        report_type: ReportType.HateSpeech,
        report_desc: 'Spam channel',
        channel_id: 20,
      };

      const result = await service.create(dto as any, mockUser);
      expect(result?.channel_id).toBe(20);
    });

    it('should throw ForbiddenException if neither material_id nor channel_id is provided', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      const dto = {
        report_type: ReportType.HateSpeech,
        report_desc: 'No target',
      };

      await expect(service.create(dto as any, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all reports', async () => {
      prisma.report.findMany.mockResolvedValue([mockReport]);

      const result = await service.findAll();
      expect(result).toEqual([mockReport]);
    });

    it('should return message when no reports found', async () => {
      prisma.report.findMany.mockResolvedValue(null);
      const result = await service.findAll();
      expect(result).toEqual({ message: 'No reports found.' });
    });
  });

  describe('findOne', () => {
    it('should return a single report by id', async () => {
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.findOne(1);
      expect(result).toEqual(mockReport);
    });

    it('should return message when report not found', async () => {
      prisma.report.findUnique.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toEqual({ message: 'No report found.' });
    });
  });

  describe('findByReportType', () => {
    it('should return reports filtered by type', async () => {
      prisma.report.findMany.mockResolvedValue([mockReport]);

      const result = await service.findByReportType(ReportType.HateSpeech);
      expect(result).toEqual([mockReport]);
    });

    it('should return message when no reports found for type', async () => {
      prisma.report.findMany.mockResolvedValue(null);
      const result = await service.findByReportType(ReportType.HateSpeech);
      expect(result).toEqual({ message: 'No report found.' });
    });
  });

  describe('reportsOnMaterial', () => {
    it('should return reports on a material', async () => {
      prisma.report.findMany.mockResolvedValue([mockReport]);

      const result = await service.reportsOnMaterial(10);
      expect(result).toEqual([mockReport]);
    });

    it('should return message when no reports found on material', async () => {
      prisma.report.findMany.mockResolvedValue(null);
      const result = await service.reportsOnMaterial(999);
      expect(result).toEqual({ message: 'No report found on material.' });
    });
  });

  describe('reportsOnChannel', () => {
    it('should return reports on a channel', async () => {
      prisma.report.findMany.mockResolvedValue([
        { ...mockReport, channel_id: 5, material_id: null },
      ]);

      const result = await service.reportsOnChannel(5);
      expect(result).toHaveLength(1);
    });

    it('should return message when no reports found on channel', async () => {
      prisma.report.findMany.mockResolvedValue(null);
      const result = await service.reportsOnChannel(999);
      expect(result).toEqual({ message: 'No report found on channel.' });
    });
  });

  describe('remove', () => {
    it('should successfully delete an existing report', async () => {
      prisma.report.findFirst.mockResolvedValue(mockReport);
      prisma.report.delete.mockResolvedValue(mockReport);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Report deleted successfully' });
    });

    it('should throw ForbiddenException if report not found', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });
  });
});
