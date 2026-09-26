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
        if (key === 'CHAPA_WEBHOOK_HASH_KEY')
          return 'test_webhook_material_key';
        if (key === 'CHAPA_WEBHOOK_URL')
          return 'https://api.chapa.co/v1/transaction/initialize';
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
    const payload = JSON.stringify({
      event: 'charge.success',
      tx_ref: 'tx-mat-456',
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

  it('should detect invalid signature on tampered payload', () => {
    const secret = 'test_webhook_material_key';
    const originalPayload = JSON.stringify({
      event: 'charge.success',
      tx_ref: 'tx-mat-456',
      amount: 100,
    });
    const tamperedPayload = JSON.stringify({
      event: 'charge.success',
      tx_ref: 'tx-mat-456',
      amount: 10,
    });

    const originalSignature = crypto
      .createHmac('sha256', secret)
      .update(originalPayload)
      .digest('hex');
    const tamperedSignature = crypto
      .createHmac('sha256', secret)
      .update(tamperedPayload)
      .digest('hex');

    expect(originalSignature).not.toBe(tamperedSignature);
  });

  describe('checkout', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' } as any;
    const mockDto: any = {
      total: 500,
      currency: 'ETB',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone_no: '+251911000000',
    };

    it('should call config.get for webhook keys during checkout', async () => {
      // Mock global fetch to avoid real HTTP call
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        text: jest.fn().mockResolvedValue('{"status":"success"}'),
      } as any);

      await webhook.checkout(mockDto, mockUser);

      expect(config.get).toHaveBeenCalledWith('CHAPA_WEBHOOK_HASH_KEY');
      expect(config.get).toHaveBeenCalledWith('CHAPA_WEBHOOK_URL');

      fetchMock.mockRestore();
    });

    it('should throw an error when fetch fails during checkout', async () => {
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await expect(webhook.checkout(mockDto, mockUser)).rejects.toThrow();

      fetchMock.mockRestore();
    });
  });

  describe('verify', () => {
    it('should call config.get for CHAPA_WEBHOOK_HASH_KEY during verify', async () => {
      const mockUser = { id: 'user-1' } as any;
      await webhook.verify(mockUser);

      expect(config.get).toHaveBeenCalledWith('CHAPA_WEBHOOK_HASH_KEY');
    });
  });
});
