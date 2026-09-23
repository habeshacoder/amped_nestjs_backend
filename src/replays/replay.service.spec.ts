import { Test, TestingModule } from '@nestjs/testing';
import { ReplayService } from './replay.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('ReplayService', () => {
  let service: ReplayService;
  let prisma: {
    replay: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    rate: {
      findFirst: jest.Mock;
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
        update: jest.fn(),
        delete: jest.fn(),
      },
      rate: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReplayService, { provide: PrismaService, useValue: prisma }],
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

      await expect(service.create(dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should map P2002 error to Credentials Taken ForbiddenException', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);
      const p2002 = new PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.replay.create.mockRejectedValue(p2002);

      await expect(
        service.create({ remark_id: 10, replay: 'text' } as any),
      ).rejects.toThrow('Credentials Taken');
    });

    it('should throw generic ForbiddenException on unexpected error', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);
      prisma.replay.create.mockRejectedValue(new Error('Unknown DB Error'));

      await expect(
        service.create({ remark_id: 10, replay: 'text' } as any),
      ).rejects.toThrow('There has been an error. Please check the inputs');
    });
  });

  describe('findAll', () => {
    it('should return all replays', async () => {
      prisma.replay.findMany.mockResolvedValue([mockReplay]);

      const result = await service.findAll();
      expect(result).toEqual([mockReplay]);
    });

    it('should return fallback message when no comments are found', async () => {
      prisma.replay.findMany.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual({ message: 'No comment found.' });
    });
  });

  describe('findOne', () => {
    it('should return single replay by id', async () => {
      prisma.replay.findUnique.mockResolvedValue(mockReplay);

      const result = await service.findOne(1);
      expect(result).toEqual(mockReplay);
    });

    it('should return fallback message when replay not found by id', async () => {
      prisma.replay.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toEqual({ message: 'No replay found.' });
    });
  });

  describe('checkReplays', () => {
    it('should return true if replay exists for remark', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);

      const result = await service.checkReplays(10);
      expect(result).toBe(true);
    });

    it('should return false if replay does not exist for remark', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);

      const result = await service.checkReplays(10);
      expect(result).toBe(false);
    });
  });

  describe('findByRemarkId', () => {
    it('should return replay for remark if found', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);

      const result = await service.findByRemarkId(10);
      expect(result).toEqual(mockReplay);
    });

    it('should return message if replay not found for remark', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);

      const result = await service.findByRemarkId(999);
      expect(result).toEqual({ message: 'No replay found.' });
    });
  });

  describe('replayForRemark', () => {
    it('should return paired remark and replay when both exist', async () => {
      prisma.rate.findFirst.mockResolvedValue({
        id: 10,
        remark: 'Great channel!',
      });
      prisma.replay.findFirst.mockResolvedValue({
        id: 1,
        replay: 'Thank you!',
      });

      const result = await service.replayForRemark(10);
      expect(result).toEqual({
        remark: 'Great channel!',
        replay: 'Thank you!',
      });
    });

    it('should return fallback message when remark or replay is missing', async () => {
      prisma.rate.findFirst.mockResolvedValue(null);
      prisma.replay.findFirst.mockResolvedValue(null);

      const result = await service.replayForRemark(999);
      expect(result).toEqual({ message: 'No replay for this remark.' });
    });
  });

  describe('update', () => {
    it('should update replay if found', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);
      prisma.replay.update.mockResolvedValue({
        ...mockReplay,
        replay: 'Updated text',
      });

      const result = await service.update(1, { replay: 'Updated text' });
      expect(result.replay).toBe('Updated text');
    });

    it('should throw ForbiddenException if replay not found to update', async () => {
      prisma.replay.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, { replay: 'Updated text' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should map prisma error during update', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);
      prisma.replay.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.update(1, { replay: 'Updated text' }),
      ).rejects.toThrow(ForbiddenException);
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

    it('should throw ForbiddenException if delete fails', async () => {
      prisma.replay.findFirst.mockResolvedValue(mockReplay);
      prisma.replay.delete.mockRejectedValue(new Error('Delete error'));

      await expect(service.remove(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
