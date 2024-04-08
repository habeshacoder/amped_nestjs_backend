import { Module } from '@nestjs/common';
import { SocialLinksProfileService } from './social-links-profile.service';
import { SocialLinksProfileController } from './social-links-profile.controller';

@Module({
  controllers: [SocialLinksProfileController],
  providers: [SocialLinksProfileService]
})
export class SocialLinksProfileModule {}
