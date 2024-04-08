import { Module } from '@nestjs/common';
import { SocialLinksChannelService } from './social-links-channel.service';
import { SocialLinksChannelController } from './social-links-channel.controller';

@Module({
  controllers: [SocialLinksChannelController],
  providers: [SocialLinksChannelService]
})
export class SocialLinksChannelModule {}
