/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionPlanDto, UpdateDto } from './dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private prisma: PrismaService) {}

  async create(subscriptionPlanDto: SubscriptionPlanDto) {
    for await (let [i, sub] of subscriptionPlanDto.channel_id.entries()) {
      //let sub of subscriptionPlanDto.channel_id) {
      try {
        const subscriptionPlan = await this.prisma.subscriptionPlan.create({
          data: {
            name: subscriptionPlanDto.name[i],
            description: subscriptionPlanDto.description[i],
            price: +subscriptionPlanDto.price[i],
            channel_id: +subscriptionPlanDto.channel_id[i],
          },
        });
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
    }

    const cUpdate = await this.prisma.channel.update({
      where: {
        id: +subscriptionPlanDto.channel_id[0],
      },
      data: {
        draft: false,
      },
    });

    const subPlan = await this.prisma.subscriptionPlan.findMany({
      where: {
        channel_id: +subscriptionPlanDto.channel_id[0],
      },
    });

    return subPlan;
  }

  async findAll() {
    return await this.prisma.subscriptionPlan.findMany();
  }

  async findOne(id: number) {
    //also add all associated data like images and preview
    return await this.prisma.subscriptionPlan.findUnique({
      where: {
        id,
      },
    });
  }

  async getMaterialsInSubPlan(id: number) {
    try {
      const response = await this.prisma.materialInSubscriptionPlan.findMany({
        where: {
          subscriptionPlan_id: id,
        },
      });
      return response;
    } catch (error) {
      throw new ForbiddenException(
        'There has been an error. Please check the inputs and try again.',
      );
    }
  }

  async findForChannel(id: number) {
    return await this.prisma.subscriptionPlan.findMany({
      where: {
        channel_id: id,
      },
      include: {
        Channel: true,
        material_in_subscription_plan: true,
      },
    });
  }

  async findForSeller(id: number) {
    const channel = await this.prisma.channel.findMany({
      where: {
        sellerProfile_id: id,
      },
    });

    let subs = [];

    for await (let chan of channel) {
      subs.push(
        await this.prisma.subscriptionPlan.findMany({
          where: {
            channel_id: chan.id,
          },
          include: {
            Channel: true,
          },
        }),
      );
    }

    return subs;
  }

  async update(id: number, subscriptionPlanDto: UpdateDto) {
    const subscriptionPlan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: id,
      },
    });

    if (subscriptionPlan) {
      try {
        const newSubscriptionPlan = await this.prisma.subscriptionPlan.update({
          where: {
            id: id,
          },
          data: {
            name: subscriptionPlanDto.name,
            description: subscriptionPlanDto.description,
            price: +subscriptionPlanDto.price,
            channel_id: +subscriptionPlanDto.channel_id,
          },
        });

        if (newSubscriptionPlan) {
          return newSubscriptionPlan;
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
        "Can't update while there is no subscription plan. Please create a subscription plan first.",
      );
    }
  }

  async remove(id: number) {
    const subscriptionPlan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: id,
      },
      include: {
        material_in_subscription_plan: true,
      },
    });

    if (subscriptionPlan.material_in_subscription_plan != null) {
      if (subscriptionPlan) {
        //remove all related data like relation with material
        try {
          const subscriptionPlan = await this.prisma.subscriptionPlan.delete({
            where: {
              id: id,
            },
          });

          if (subscriptionPlan) {
            return { message: 'Subscription Plan deleted successfully' };
          }
        } catch (error) {
          throw new ForbiddenException(
            'There has been an error. Please check the inputs and try again.',
          );
        }
      } else {
        throw new ForbiddenException(
          "Can't delete while there is no Subscription Plan. Please create a Subscription Plan first.",
        );
      }
    } else {
      return {
        message:
          'Subscription Plan has files inside. please remove them first to delete the plan.',
      };
    }
  }
}
