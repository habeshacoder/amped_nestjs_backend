import { Test, TestingModule } from '@nestjs/testing';
import { ChannelMaterialService } from './channel-material.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { Parent, Type } from '@prisma/client';

import { ChannelMaterialQueryService } from './channel-material-query.service';
import { ChannelMaterialStorageService } from './channel-material-storage.service';
import { FileStorageService } from '../common/services/file-storage.service';

describe('ChannelMaterialService', () => {
  let service: ChannelMaterialService;
  let prisma: {
    channelMaterial: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    materialInSubscriptionPlan: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      channelMaterial: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      materialInSubscriptionPlan: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelMaterialService,
        ChannelMaterialQueryService,
        ChannelMaterialStorageService,
        FileStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelMaterialService>(ChannelMaterialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a channel material without subscriptions', async () => {
      const dto: any = {
        title: 'New Channel Material',
        parent: Parent.Publication,
        type: Type.Book,
        genere: 'News',
        catagory: 'Tech',
        description: 'Desc',
        author: 'Author',
        reader: 'Reader',
        translator: 'Translator',
        length_minute: 10,
        length_page: 5,
        first_published_at: new Date(),
        language: 'EN',
        publisher: 'Publisher',
        episode: 1,
        continues_from: 0,
        sellerProfile_id: 1,
      };

      prisma.channelMaterial.create.mockResolvedValue({ id: 101, ...dto });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 101);
      expect(prisma.materialInSubscriptionPlan.create).not.toHaveBeenCalled();
    });

    it('should create channel material with subscription ids', async () => {
      const dto: any = {
        title: 'Subscribed Channel Material',
        parent: Parent.Audio,
        type: Type.Audiobook,
        genere: 'Podcast',
        catagory: 'Tech',
        sellerProfile_id: 1,
        subscription_id: [1, 2],
      };

      prisma.channelMaterial.create.mockResolvedValue({ id: 102, ...dto });
      prisma.materialInSubscriptionPlan.create.mockResolvedValue({});

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 102);
      expect(prisma.materialInSubscriptionPlan.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return all channel materials with includes', async () => {
      prisma.channelMaterial.findMany.mockResolvedValue([
        { id: 1, title: 'Item 1' },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.channelMaterial.findMany).toHaveBeenCalledWith({
        include: {
          channel_material_image: true,
          channel_material_preview: true,
          material_in_subscription_plan: true,
          rate: true,
          report: true,
        },
      });
    });
  });

  describe('getMaterialByType', () => {
    it('should filter channel materials by type', async () => {
      prisma.channelMaterial.findMany.mockResolvedValue([
        { id: 1, type: Type.Book },
      ]);

      const result = await service.getMaterialByType(Type.Book);
      expect(result).toHaveLength(1);
      expect(prisma.channelMaterial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: Type.Book },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return channel material if found', async () => {
      prisma.channelMaterial.findUnique.mockResolvedValue({
        id: 1,
        title: 'Found',
      });

      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, title: 'Found' });
    });

    it('should return message if material not found', async () => {
      prisma.channelMaterial.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toEqual({ message: 'Material Not Found' });
    });
  });

  describe('findForSeller', () => {
    it('should return channel materials for seller', async () => {
      prisma.channelMaterial.findMany.mockResolvedValue([
        { id: 1, sellerProfile_id: 5 },
      ]);

      const result = await service.findForSeller(5);
      expect(result).toHaveLength(1);
      expect(prisma.channelMaterial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerProfile_id: 5 },
        }),
      );
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if material does not exist', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(ForbiddenException);
    });

    it('should delete material if exists', async () => {
      prisma.channelMaterial.findFirst.mockResolvedValue({ id: 10 });
      prisma.channelMaterial.delete.mockResolvedValue({ id: 10 });

      const result = await service.remove(10);
      expect(result).toEqual({ message: 'Material deleted successfully' });
    });
  });
});
