import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EntityFileManagerConfig,
  EntityFileManagerService,
} from '../common/services/entity-file-manager.service';
import { BaseEntityStorageService } from '../common/services/base-entity-storage.service';

@Injectable()
export class ChannelMaterialStorageService extends BaseEntityStorageService {
  protected readonly config: EntityFileManagerConfig;

  constructor(prisma: PrismaService, fileManager: EntityFileManagerService) {
    super(prisma, fileManager);
    this.config = {
      subDirectory: 'channel',
      foreignKey: 'channel_material_id',
      entityName: 'Material',
      notFoundErrorCode: 'CHANNEL_MATERIAL_NOT_FOUND',
      includeRelations: {
        channel_material_image: true,
        channel_material_preview: true,
      },
      parentDelegate: this.prisma.channelMaterial,
      imageDelegate: this.prisma.channelMaterialImage,
      previewDelegate: this.prisma.channelPreviewMaterial,
    };
  }
}
