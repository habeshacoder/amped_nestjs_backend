import { Module } from '@nestjs/common';
// import { MaterialPurchaseService } from './material-purchase.service';
// import { MaterialPurchaseController } from './material-purchase.controller';
import { ChapaModule } from 'chapa-nestjs';
import { ChapaWebHook } from './webhook.material';

@Module({
  imports: [ChapaModule.register({
    secretKey: 'CHASECK_TEST-kJbuku9DdyubpiFzA0kAOX9gzNK3uciN',
  })],
  // controllers: [MaterialPurchaseController],
  // providers: [MaterialPurchaseService]
})
export class MaterialPurchaseModule{}