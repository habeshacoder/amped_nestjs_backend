import { Module } from '@nestjs/common';
import { ChannelMaterialService } from './channel-material.service';
import { ChannelMaterialController } from './channel-material.controller';
import { ChannelMaterialQueryService } from './channel-material-query.service';
import { ChannelMaterialStorageService } from './channel-material-storage.service';

@Module({
  controllers: [ChannelMaterialController],
  providers: [
    ChannelMaterialService,
    ChannelMaterialQueryService,
    ChannelMaterialStorageService,
  ],
  exports: [
    ChannelMaterialService,
    ChannelMaterialQueryService,
    ChannelMaterialStorageService,
  ],
})
export class ChannelMaterialModule {}
