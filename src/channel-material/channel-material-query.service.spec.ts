import { Test, TestingModule } from '@nestjs/testing';
import { ChannelMaterialQueryService } from './channel-material-query.service';
import { PrismaService } from '../prisma/prisma.service';
import { Type } from '@prisma/client';

describe('ChannelMaterialQueryService', () => {
  let service: ChannelMaterialQueryService;
  let prisma: {
    channelMaterial: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  const mockChannelMaterial = {
    id: 1,
    title: 'Test Channel Material',
    type: Type.Book,
  };

  beforeEach(async () => {
    prisma = {
      channelMaterial: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelMaterialQueryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelMaterialQueryService>(
      ChannelMaterialQueryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return channel materials', async () => {
    prisma.channelMaterial.findMany.mockResolvedValue([mockChannelMaterial]);
    const result = await service.findAll();
    expect(result).toEqual([mockChannelMaterial]);
  });

  it('findOne should return channel material by id', async () => {
    prisma.channelMaterial.findUnique.mockResolvedValue(mockChannelMaterial);
    const result = await service.findOne(1);
    expect(result).toEqual(mockChannelMaterial);
  });
});
