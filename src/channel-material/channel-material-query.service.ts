import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { Type } from '@prisma/client';

@Injectable()
export class ChannelMaterialQueryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.channelMaterial.findMany({
      include: {
        channel_material_image: true,
        channel_material_preview: true,
        material_in_subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async getMaterialByType(materialType: Type) {
    return await this.prisma.channelMaterial.findMany({
      where: {
        type: materialType,
      },
      orderBy: {
        first_published_at: 'desc',
      },
      include: {
        channel_material_image: true,
        channel_material_preview: true,
        material_in_subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async findOne(id: number) {
    try {
      const material = await this.prisma.channelMaterial.findUnique({
        where: {
          id: id,
        },
        include: {
          channel_material_image: true,
          channel_material_preview: true,
          material_in_subscription_plan: true,
          rate: true,
          report: true,
        },
      });

      if (material) {
        return material;
      } else {
        return { message: 'Material Not Found' };
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Wrong link');
        }
      }
      throw new ForbiddenException(
        'There has been an error. Please check the link and try again.',
      );
    }
  }

  async findForSeller(id: number) {
    return await this.prisma.channelMaterial.findMany({
      where: {
        sellerProfile_id: id,
      },
      include: {
        channel_material_image: true,
        channel_material_preview: true,
        material_in_subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async getMaterialCoverName(id: number) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: id,
      },
    });

    return materialImage?.image;
  }
}
