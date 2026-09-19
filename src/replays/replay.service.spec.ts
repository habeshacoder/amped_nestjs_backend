import { Test, TestingModule } from '@nestjs/testing';
import { ReplayService } from './replay.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('ReplayService', () => {
  let service: ReplayService;
  let prisma: {
    replay: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockReplay = {
    id: 1,
    remark_id: 10,
    replay: 'Thank you for your feedback!',
  };

  beforeEach(async () => {
    prisma = {
      replay: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReplayService>(ReplayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create replay successfully', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);
      prisma.replay.create.mockResolvedValue(mockReplay);

      const dto = {
        remark_id: 10,
        replay: 'Thank you for your feedback!',
      };

      const result = await service.create(dto as any);
      expect(result).toEqual(mockReplay);
    });

    it('should throw ForbiddenException if replay already exists on remark', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);

      const dto = {
        remark_id: 10,
        replay: 'Thank you for your feedback!',
      };

      await expect(service.create(dto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all replays', async () => {
      prisma.replay.findMany.mockResolvedValue([mockReplay]);

      const result = await service.findAll();
      expect(result).toEqual([mockReplay]);
    });
  });

  describe('findOne', () => {
    it('should return single replay by id', async () => {
      prisma.replay.findUnique.mockResolvedValue(mockReplay);

      const result = await service.findOne(1);
      expect(result).toEqual(mockReplay);
    });
  });

  describe('remove', () => {
    it('should delete replay if found', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);
      prisma.replay.delete.mockResolvedValue(mockReplay);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Replay deleted successfully' });
    });

    it('should throw ForbiddenException if replay not found', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(ForbiddenException);
    });
  });
});
