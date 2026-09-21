import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MaterialQueryService } from './material-query.service';
import { MaterialStorageService } from './material-storage.service';
import { EntityFileManagerService } from '../common/services/entity-file-manager.service';

@Module({
  controllers: [MaterialController],
  providers: [
    MaterialService,
    MaterialQueryService,
    MaterialStorageService,
    EntityFileManagerService,
  ],
  exports: [
    MaterialService,
    MaterialQueryService,
    MaterialStorageService,
    EntityFileManagerService,
  ],
})
export class MaterialModule {}
