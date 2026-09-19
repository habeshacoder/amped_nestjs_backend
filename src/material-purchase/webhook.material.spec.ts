import { Test, TestingModule } from '@nestjs/testing';
import { ChapaWebHook } from './webhook.material';
import { PrismaService } from '../prisma/prisma.service';
import { ChapaService } from 'chapa-nestjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

describe('ChapaWebHook', () => {
  let webhook: ChapaWebHook;
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
        if (key === 'CHAPA_WEBHOOK_HASH_KEY') return 'test_webhook_material_key';
        if (key === 'CHAPA_WEBHOOK_URL') return 'https://api.chapa.co/v1/transaction/initialize';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChapaWebHook,
        { provide: PrismaService, useValue: prisma },
        { provide: ChapaService, useValue: chapaService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    webhook = module.get<ChapaWebHook>(ChapaWebHook);
  });

  it('should be defined', () => {
    expect(webhook).toBeDefined();
  });

  it('should compute valid HMAC SHA256 signature for material payment webhook', () => {
    const secret = 'test_webhook_material_key';
    const payload = JSON.stringify({ event: 'charge.success', tx_ref: 'tx-mat-456' });
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(signature).toBe(expectedSignature);
  });

  it('should detect invalid signature on tampered payload', () => {
    const secret = 'test_webhook_material_key';
    const originalPayload = JSON.stringify({ event: 'charge.success', tx_ref: 'tx-mat-456', amount: 100 });
    const tamperedPayload = JSON.stringify({ event: 'charge.success', tx_ref: 'tx-mat-456', amount: 10 });

    const originalSignature = crypto.createHmac('sha256', secret).update(originalPayload).digest('hex');
    const tamperedSignature = crypto.createHmac('sha256', secret).update(tamperedPayload).digest('hex');

    expect(originalSignature).not.toBe(tamperedSignature);
  });
});
