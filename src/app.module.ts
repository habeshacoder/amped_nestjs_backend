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
import { CommonModule } from './common/common.module';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().default(3007),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_REFRESH_SECRET: Joi.string().min(16).required(),
        CHAPA_SECRET_KEY: Joi.string().allow('').optional().default(''),
        CHAPA_WEBHOOK_HASH_KEY: Joi.string().allow('').optional().default(''),
        CHAPA_WEBHOOK_URL: Joi.string().allow('').optional().default(''),
        SHADOW_DATABASE_URL: Joi.string().allow('').optional().default(''),
        SENTRY_DSN: Joi.string().allow('').optional().default(''),
        CORS_ORIGIN: Joi.string().allow('').optional().default('*'),
        THROTTLE_TTL: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(100),
      }),
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV') || 'development';
        const isProd = nodeEnv === 'production';
        const isTest = nodeEnv === 'test';
        return {
          pinoHttp: {
            level: isTest ? 'silent' : isProd ? 'info' : 'debug',
            transport:
              isProd || isTest
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                      colorize: true,
                    },
                  },
            genReqId: (req: any) =>
              (req.headers['x-request-id'] as string) || randomUUID(),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.token',
                'res.headers["set-cookie"]',
              ],
              censor: '***REDACTED***',
            },
          },
        };
      },
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
