import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProfilesModule } from './profiles/profiles.module';
import { MulterModule } from '@nestjs/platform-express/multer';
import { SellerProfilesModule } from './seller-profiles/seller-profiles.module';
import { MaterialModule } from './material/material.module';
import { ChannelMaterialModule } from './channel-material/channel-material.module';
import { SocialLinksProfileModule } from './social-links-profile/social-links-profile.module';
import { ChannelModule } from './channel/channel.module';
import { SocialLinksChannelModule } from './social-links-channel/social-links-channel.module';
import { SubscriptionPlanModule } from './subscription-plan/subscription-plan.module';
import { MaterialPurchaseModule } from './material-purchase/material-purchase.module';
import { RatingModule } from './rating/rating.module';
import { ReplayModule } from './replays/replay.module';
import { ReportModule } from './reports/report.module';
import { SubscibedUserModule } from './subscribed-user/subscribed-user.module';
import { FavoriteModule } from './favorite/favorite.module';
import { SearchModule } from './search/search.module';
import { ChannelPurchaseModule } from './channel-purchase/channel-purchase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    ProfilesModule,
    MulterModule.register({ dest: './uploads' }),
    SellerProfilesModule,
    MaterialModule,
    ChannelMaterialModule,
    SocialLinksProfileModule,
    ChannelModule,
    SocialLinksChannelModule,
    SubscriptionPlanModule,
    MaterialPurchaseModule,
    RatingModule,
    ReplayModule,
    ReportModule,
    SubscibedUserModule,
    FavoriteModule,
    SearchModule,
    ChannelPurchaseModule,
  ],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //     // consumer.apply(PreauthMiddleware).forRoutes({
  //     //     path: '/auth/firebase', method: RequestMethod.GET,
  //     // });
  // }
}
