import { ForbiddenException, Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelQueryService {
  private readonly logger = new Logger(ChannelQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ForbiddenException('Credentials Taken');
    }
    throw new ForbiddenException(
      'There has been an error. Please check the inputs and try again.',
    );
  }

  async findAll() {
    return await this.prisma.channel.findMany({
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
        SellerProfile: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async paginateChannels(params: { take?: number; page?: number }) {
    const take = params.take ?? 10;
    const page = params.page ?? 0;

    let skip: number | null = null;
    const num_of_channel = await this.prisma.channel.count();
    const totalPages = Math.ceil(num_of_channel / take);

    if (page >= 0 && page < totalPages) {
      skip = take * page;
    } else {
      throw new ForbiddenException('Page Not Found');
    }

    let previousPage: number | null = page - 1;
    let nextPage: number | null = page + 1;
    const lastPage = totalPages - 1;

    let channels_in_last_page = num_of_channel % take;
    if (channels_in_last_page === 0) channels_in_last_page = take;

    if (page === 0) previousPage = null;
    if (nextPage >= totalPages) nextPage = null;

    const meta = {
      Num_Of_Channels: num_of_channel,
      Num_Of_Pages: totalPages,
      Per_Page: take,
      Channels_In_last_page: channels_in_last_page,
      self: page,
      prev: previousPage,
      next: nextPage,
      last: lastPage,
    };

    const channels = await this.prisma.channel.findMany({
      take,
      skip,
      orderBy: {
        id: 'desc',
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
      },
    });

    return { Materials: channels, Meta: meta };
  }

  async findOne(id: number) {
    if (!Number.isNaN(id) && id != null) {
      try {
        return await this.prisma.channel.findUnique({
          where: { id },
          include: {
            channel_image: true,
            channel_preview: true,
            social_links_channel: true,
            subscription_plan: true,
            rate: true,
            report: true,
            SellerProfile: true,
          },
        });
      } catch (error) {
        this.handlePrismaError(error);
      }
    } else {
      throw new ForbiddenException(
        'There has been an error. Please check the inputs and try again.',
      );
    }
  }

  async getMyChannels(sellerId: number) {
    if (!Number.isNaN(sellerId) && sellerId != null) {
      try {
        return await this.prisma.channel.findMany({
          where: { sellerProfile_id: sellerId },
          include: {
            channel_image: true,
            channel_preview: true,
            social_links_channel: true,
            subscription_plan: true,
            rate: true,
            report: true,
            SellerProfile: true,
          },
        });
      } catch (error) {
        this.handlePrismaError(error);
      }
    } else {
      throw new ForbiddenException(
        'There has been an error. Please check the inputs and try again.',
      );
    }
  }

  async newChannels() {
    return await this.prisma.channel.findMany({
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
        SellerProfile: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findForSeller(id: number) {
    return await this.prisma.channel.findMany({
      where: {
        sellerProfile_id: id,
        draft: false,
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
        SellerProfile: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async findDraftForSeller(id: number) {
    return await this.prisma.channel.findMany({
      where: {
        sellerProfile_id: id,
        draft: true,
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
        SellerProfile: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async showChannelProfile(channelId: number, @Res() res: Response) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: { channel_id: channelId, primary: true },
    });
    if (!channelImage) {
      throw new ForbiddenException('Channel profile image not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/channel', channelImage.image),
    );
  }

  async showChannelCover(id: number, @Res() res: Response) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: { channel_id: id, cover: true },
    });
    if (!channelImage) {
      throw new ForbiddenException('Channel cover image not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/channel', channelImage.image),
    );
  }

  async showChannelImage(id: number, @Res() res: Response) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: { id },
    });
    if (!channelImage) {
      throw new ForbiddenException('Channel image not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/channel', channelImage.image),
    );
  }

  async getChannelCoverImageName(channel_id: number) {
    return await this.prisma.channelImage.findFirst({
      where: { channel_id, cover: true },
      select: { image: true },
    });
  }

  async showChannelPreview(id: number, @Res() res: Response) {
    const channelPreview = await this.prisma.previewChannel.findFirst({
      where: { channel_id: id },
    });
    if (!channelPreview) {
      throw new ForbiddenException('Channel preview not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/channel', channelPreview.preview),
    );
  }
}
