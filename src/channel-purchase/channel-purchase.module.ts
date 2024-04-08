import { Module } from '@nestjs/common';
// import { ChannelPurchaseService } from './channel-purchase.service';
// import { ChannelPurchaseController } from './channel-purchase.controller';
import { ChapaModule } from 'chapa-nestjs';
import { ChapaWebHookChannel } from './webhook.channel';

@Module({
  imports: [ChapaModule.register({
    secretKey: 'CHASECK_TEST-kJbuku9DdyubpiFzA0kAOX9gzNK3uciN',
  })],
  // controllers: [ChannelPurchaseController],
  // providers: [ChannelPurchaseService]
})
export class ChannelPurchaseModule{}