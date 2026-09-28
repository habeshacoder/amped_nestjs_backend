import { Module } from '@nestjs/common';
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

import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { createPinoHttpConfig } from './common/logger/pino-logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createPinoHttpConfig(config),
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    CommonModule,
    ProfilesModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 200 * 1024 * 1024,
      },
    }),
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
    HealthModule,
    MetricsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60000,
          limit: config.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
