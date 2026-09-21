import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribedUserDto } from './dto';
import { UpdateSubscribedUserDto } from './dto/update-subscribed-user.dto';

@Injectable()
export class SubscribedUserService {
  constructor(private prisma: PrismaService) {}

  private handlePrismaError(
    error: unknown,
    conflictMsg = 'Credentials Taken',
  ): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ForbiddenException(conflictMsg);
    }
    throw new ForbiddenException(
      'There has been an error. Please check the inputs and try again.',
    );
  }

  async create(subscribedUserDto: SubscribedUserDto, user: User) {
    const subscribedUser = await this.prisma.subscribedUser.findFirst({
      where: {
        subscription_id: subscribedUserDto.subscription_id,
        user_id: user.id,
      },
    });

    if (!subscribedUser) {
      try {
        const subscribedUser = await this.prisma.subscribedUser.create({
          data: {
            user_id: user.id,
            subscription_id: subscribedUserDto.subscription_id,
            // name: subscribedUserDto.name,
          },
        });

        if (subscribedUser) {
          return subscribedUser;
        }
      } catch (error) {
        this.handlePrismaError(error, 'ForbiddenException');
      }
    } else {
      throw new ForbiddenException(
        'There has been an error. Please set subscription and name .',
      );
    }
  }

  async findAll() {
    const subscribedUsers = await this.prisma.subscribedUser.findMany();

    if (subscribedUsers) {
      return subscribedUsers;
    } else {
      return { message: 'No subscribed user found.' };
    }
  }

  async findOne(id: number) {
    const subscribedUser = await this.prisma.subscribedUser.findUnique({
      where: {
        id,
      },
    });

    if (subscribedUser) {
      return subscribedUser;
    } else {
      return { message: 'No subscribed user found.' };
    }
  }

  async update(id: number, updateSubscribedUserDto: UpdateSubscribedUserDto) {
    const findSubscribedUser = await this.prisma.subscribedUser.findFirst({
      where: {
        id: id,
      },
    });

    if (findSubscribedUser) {
      try {
        const subscribedUser = await this.prisma.subscribedUser.update({
          where: {
            id: id,
          },
          data: {
            // name: updateSubscribedUserDto.name,
          },
        });

        if (subscribedUser) {
          return subscribedUser;
        } else {
          throw new ForbiddenException(
            'There has been an error. Please check the inputs and try again.',
          );
        }
      } catch (error) {
        this.handlePrismaError(error);
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no Subscribed User.",
      );
    }
  }

  async remove(id: number) {
    const findSubscribedUser = await this.prisma.subscribedUser.findFirst({
      where: {
        id: id,
      },
    });

    if (findSubscribedUser) {
      try {
        const specialPrice = await this.prisma.subscribedUser.delete({
          where: {
            id: id,
          },
        });

        if (specialPrice) {
          return { message: 'Subscribed User deleted successfully' };
        }
      } catch (error) {
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't delete while there is no Subscribed User.",
      );
    }
  }
}
