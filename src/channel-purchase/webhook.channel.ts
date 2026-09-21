import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Channel_PurchaseDto } from './dto';
import { ChapaService } from 'chapa-nestjs';
import * as crypto from 'crypto';

@Injectable()
export class ChapaWebHookChannel {
  private readonly logger = new Logger(ChapaWebHookChannel.name);

  constructor(
    private prisma: PrismaService,
    private chapaService: ChapaService,
    private config: ConfigService,
  ) {}

  async checkout(dto: Channel_PurchaseDto, user: User) {
    //collect all the materials that are ordered to be purchased
    //send the link top the payment

    const secret = this.config.get('CHAPA_WEBHOOK_HASH_KEY');
    const webhook_URL = this.config.get('CHAPA_WEBHOOK_URL');

    const body = JSON.stringify({
      amount: dto.total.toString(),
      currency: dto.currency,
      email: user.email,
      first_name: 'biniyam',
      last_name: 'belayneh',
      tx_ref: secret,
      callback_url: 'https://localhost:3000/channel-purchase/verify',
      return_url: 'https://localhost:3000/channel-purchase/cart',
      'customization[title]': 'Payment from AratKillo',
      'customization[description]': 'add the list of bought items here',
    });

    try {
      const response = await fetch(webhook_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await response.text();
      this.logger.log(data);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async verify(user: User) {
    //here check is payment is verified
    //save the data as purchased
    //return a success message

    const secret = this.config.get('CHAPA_WEBHOOK_HASH_KEY');

    // Using Express
    this.config.get('CHAPA_WEBHOOK_URL'),
      (req: any, res: any) => {
        //validate event
        const hash = crypto.createHmac('sha256', secret).digest('hex');

        this.logger.log(`Hash: ${hash}`);

        if (hash == req.headers['Chapa-Signature']) {
          // Retrieve the request's body
          const event = req.body;
          // Do something with event
        }
        res.send(200);
      };
  }
}
