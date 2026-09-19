import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MaterialQueryService } from './material-query.service';
import { MaterialStorageService } from './material-storage.service';

@Module({
  controllers: [MaterialController],
  providers: [MaterialService, MaterialQueryService, MaterialStorageService],
  exports: [MaterialService, MaterialQueryService, MaterialStorageService],
})
export class MaterialModule {}
