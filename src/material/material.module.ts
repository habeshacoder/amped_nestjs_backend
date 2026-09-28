import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MaterialQueryService } from './material-query.service';
import { MaterialStorageService } from './material-storage.service';
import { EntityFileManagerService } from '../common/services/entity-file-manager.service';
import { MaterialRepository } from './material.repository';

@Module({
  controllers: [MaterialController],
  providers: [
    MaterialRepository,
    MaterialService,
    MaterialQueryService,
    MaterialStorageService,
    EntityFileManagerService,
  ],
  exports: [
    MaterialRepository,
    MaterialService,
    MaterialQueryService,
    MaterialStorageService,
    EntityFileManagerService,
  ],
})
export class MaterialModule {}
