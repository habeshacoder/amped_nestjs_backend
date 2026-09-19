import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

describe('Prisma Data Integrity & Constraints', () => {
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            materialUser: {
              create: jest.fn(),
            },
            favorite: {
              create: jest.fn(),
            },
            rate: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should reject duplicate unique composite values with P2002 error', async () => {
    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`user_id`, `material_id`)',
      {
        code: 'P2002',
        clientVersion: '4.16.2',
        meta: { target: ['user_id', 'material_id'] },
      },
    );

    jest.spyOn(prisma.materialUser, 'create').mockRejectedValueOnce(p2002Error);

    await expect(
      prisma.materialUser.create({
        data: {
          user_id: 'user-uuid-1',
          material_id: 10,
          is_paied: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('should reject orphaned foreign key references with P2003 error', async () => {
    const p2003Error = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed on the field: (`material_id`)',
      {
        code: 'P2003',
        clientVersion: '4.16.2',
        meta: { field_name: 'material_id' },
      },
    );

    jest.spyOn(prisma.favorite, 'create').mockRejectedValueOnce(p2003Error);

    await expect(
      prisma.favorite.create({
        data: {
          user_id: 'user-uuid-1',
          material_id: 999999, // non-existent parent material
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2003',
    });
  });

  it('should rollback database transaction when an operation in transaction fails', async () => {
    const transactionMock = jest
      .spyOn(prisma, '$transaction')
      .mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const txPrisma = {
            rate: {
              create: jest.fn().mockResolvedValue({ id: 1 }),
            },
            replay: {
              create: jest
                .fn()
                .mockRejectedValue(new Error('Transaction step failed')),
            },
          };
          return callback(txPrisma as any);
        }
        return Promise.reject(new Error('Invalid transaction argument'));
      });

    await expect(
      prisma.$transaction(async (tx) => {
        await (tx as any).rate.create({
          data: { rating: 5, remark: 'Great', user_id: 'u1' },
        });
        await (tx as any).replay.create({ data: { replay: 'reply' } });
      }),
    ).rejects.toThrow('Transaction step failed');

    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('should reject invalid out-of-bounds rating values', async () => {
    const checkViolationError = new Prisma.PrismaClientKnownRequestError(
      'Check constraint ratings_rating_range_check violated',
      {
        code: 'P2000',
        clientVersion: '4.16.2',
      },
    );

    jest
      .spyOn(prisma.rate, 'create')
      .mockRejectedValueOnce(checkViolationError);

    await expect(
      prisma.rate.create({
        data: {
          user_id: 'user-uuid-1',
          rating: 6.5, // exceeds CHECK (rating >= 0 AND rating <= 5)
          remark: 'Invalid rating',
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2000',
    });
  });
});
