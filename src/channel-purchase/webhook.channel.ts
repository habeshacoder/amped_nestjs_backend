import { Body, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Channel_PurchaseDto } from './dto';
import { ChapaService } from 'chapa-nestjs';
import * as request from 'request';
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

    const options = {
      method: 'POST',
      url: webhook_URL,
      body: JSON.stringify({
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
      }),
    };

    request(options, (error: any, response: any) => {
      if (error) throw new Error(error);
      this.logger.log(response.body);
    });
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
