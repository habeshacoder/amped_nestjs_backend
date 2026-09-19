import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChapaModule } from 'chapa-nestjs';

@Module({
  imports: [
    ChapaModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secretKey: config.get<string>('CHAPA_SECRET_KEY') || '',
      }),
    }),
  ],
})
export class MaterialPurchaseModule {}
