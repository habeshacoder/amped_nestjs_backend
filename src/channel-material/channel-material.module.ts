import { Module } from '@nestjs/common';
import { ChannelMaterialService } from './channel-material.service';
import { ChannelMaterialController } from './channel-material.controller';
import { ChannelMaterialQueryService } from './channel-material-query.service';
import { ChannelMaterialStorageService } from './channel-material-storage.service';
import { EntityFileManagerService } from '../common/services/entity-file-manager.service';

@Module({
  controllers: [ChannelMaterialController],
  providers: [
    ChannelMaterialService,
    ChannelMaterialQueryService,
    ChannelMaterialStorageService,
    EntityFileManagerService,
  ],
  exports: [
    ChannelMaterialService,
    ChannelMaterialQueryService,
    ChannelMaterialStorageService,
    EntityFileManagerService,
  ],
})
export class ChannelMaterialModule {}
