import { Module } from '@nestjs/common';
import { ChannelMaterialService } from './channel-material.service';
import { ChannelMaterialController } from './channel-material.controller';

@Module({
  controllers: [ChannelMaterialController],
  providers: [ChannelMaterialService]
})
export class ChannelMaterialModule {}
