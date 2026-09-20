import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { ChannelQueryService } from './channel-query.service';
import { ChannelCommandService } from './channel-command.service';

@Module({
  controllers: [ChannelController],
  providers: [ChannelService, ChannelQueryService, ChannelCommandService],
  exports: [ChannelService, ChannelQueryService, ChannelCommandService],
})
export class ChannelModule {}
