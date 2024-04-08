import { Module } from '@nestjs/common';
import { SellerProfilesService } from './seller-profiles.service';
import { SellerProfilesController } from './seller-profiles.controller';

@Module({
  controllers: [SellerProfilesController],
  providers: [SellerProfilesService]
})
export class SellerProfilesModule {}
