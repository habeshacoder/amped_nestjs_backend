import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EntityFileManagerConfig,
  EntityFileManagerService,
} from '../common/services/entity-file-manager.service';
import { BaseEntityStorageService } from '../common/services/base-entity-storage.service';

@Injectable()
export class MaterialStorageService extends BaseEntityStorageService {
  protected readonly config: EntityFileManagerConfig;

  constructor(prisma: PrismaService, fileManager: EntityFileManagerService) {
    super(prisma, fileManager);
    this.config = {
      subDirectory: 'material',
      foreignKey: 'material_id',
      entityName: 'Material',
      notFoundErrorCode: 'MATERIAL_NOT_FOUND',
      includeRelations: {
        material_image: true,
        material_preview: true,
      },
      parentDelegate: this.prisma.material,
      imageDelegate: this.prisma.materialImage,
      previewDelegate: this.prisma.previewMaterial,
    };
  }
}
