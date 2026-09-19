import { Test, TestingModule } from '@nestjs/testing';
import { ChannelMaterialStorageService } from './channel-material-storage.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChannelMaterialStorageService', () => {
  let service: ChannelMaterialStorageService;
  let prisma: {
    channelMaterial: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    channelMaterialImage: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    channelPreviewMaterial: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      channelMaterial: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      channelMaterialImage: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      channelPreviewMaterial: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelMaterialStorageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChannelMaterialStorageService>(
      ChannelMaterialStorageService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
