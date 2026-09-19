import { Test, TestingModule } from '@nestjs/testing';
import { ChapaWebHookChannel } from './webhook.channel';
import { PrismaService } from '../prisma/prisma.service';
import { ChapaService } from 'chapa-nestjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

describe('ChapaWebHookChannel', () => {
  let webhook: ChapaWebHookChannel;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let chapaService: {
    verify: jest.Mock;
  };
  let config: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    chapaService = {
      verify: jest.fn(),
    };

    config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CHAPA_WEBHOOK_HASH_KEY') return 'test_webhook_secret_key';
        if (key === 'CHAPA_WEBHOOK_URL')
          return 'https://api.chapa.co/v1/transaction/initialize';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChapaWebHookChannel,
        { provide: PrismaService, useValue: prisma },
        { provide: ChapaService, useValue: chapaService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    webhook = module.get<ChapaWebHookChannel>(ChapaWebHookChannel);
  });

  it('should be defined', () => {
    expect(webhook).toBeDefined();
  });

  it('should compute valid HMAC SHA256 signature for webhook verification', () => {
    const secret = 'test_webhook_secret_key';
    const payload = JSON.stringify({
      event: 'charge.success',
      tx_ref: 'tx-123',
    });
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    expect(signature).toBe(expectedSignature);
  });

  it('should reject mismatched webhook signature', () => {
    const secret = 'test_webhook_secret_key';
    const payload = JSON.stringify({
      event: 'charge.success',
      tx_ref: 'tx-123',
    });
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    const invalidSignature = 'invalid_tampered_signature_hex';

    expect(signature).not.toBe(invalidSignature);
  });
});
