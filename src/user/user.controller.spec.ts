import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
  } as User;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user details with relations', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        profiles: { first_name: 'John' },
      });

      const result = await controller.getMe(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          profiles: true,
          seller_profile: true,
          favorite: true,
          rate: true,
        },
      });
      expect(result).toBeDefined();
      expect(result.profiles).toBeDefined();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await controller.getAllUsers();
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete an existing user', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await controller.deleteUser({ email: 'test@example.com' });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual({ message: 'user deleted successfully' });
    });

    it('should throw ForbiddenException if user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        controller.deleteUser({ email: 'nonexistent@example.com' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if prisma delete fails', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.delete.mockRejectedValue(new Error('DB failure'));

      await expect(
        controller.deleteUser({ email: 'test@example.com' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
