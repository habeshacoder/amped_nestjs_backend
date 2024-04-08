import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscribedUserDto } from './dto';
import { UpdateSubscribedUserDto } from './dto/update-subscribed-user.dto';

@Injectable()
export class SubscribedUserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(subscribedUserDto: SubscribedUserDto, user: User) {
    const foundSubscribedUser = await this.prisma.subscribedUser.findFirst({
      where: {
        user_id: user.id,
        subscription_id: subscribedUserDto.subscription_id,
      },
    });

    if (!foundSubscribedUser) {
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
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('ForbiddenException');
          }
        }
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
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
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials Taken');
          }
        }
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
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
