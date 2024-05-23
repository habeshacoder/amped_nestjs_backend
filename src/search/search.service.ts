/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDto } from './dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async suggest(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('title', {
        contains: searchDto.key.trim(),
        mode: 'insensitive',
      });
    }

    const whe = Object.fromEntries(where);

    const foundMatterial = await this.prisma.material.findMany({
      where: whe,
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
        SellerProfile: true,
      },
    });

    let mainMatches = foundMatterial;

    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }

  async suggestChannel(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('name', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundChannel = await this.prisma.channel.findMany({
      where: whe,
      include: {
        SellerProfile: true,
        channel_image: true,
      },
    });

    var mainMatches = foundChannel;

    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }
  async suggestUser(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('username', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundUser = await this.prisma.user.findMany({
      where: whe,
    });

    var mainMatches = foundUser;

    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }

  async suggestSellerProfile(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('name', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundSellerProfile = await this.prisma.sellerProfile.findMany({
      where: whe,
    });

    var mainMatches = foundSellerProfile;

    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }
  async suggestProfile(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('first_name', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundProfile = await this.prisma.profile.findMany({
      where: whe,
    });

    var mainMatches = foundProfile;

    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }

  async suggestChannelMaterial(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('title', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundChannelMaterial = await this.prisma.channelMaterial.findMany({
      where: whe,
    });

    var mainMatches = foundChannelMaterial;
    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }
  async suggestSubscriptionPlan(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('name', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundSubscriptionPlan = await this.prisma.subscriptionPlan.findMany({
      where: whe,
    });

    var mainMatches = foundSubscriptionPlan;
    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }

  async suggestReplays(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('replay', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundReplays = await this.prisma.replay.findMany({
      where: whe,
    });

    var mainMatches = foundReplays;
    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }
  async suggestRate(searchDto: SearchDto) {
    const where = new Map<string, unknown>();

    if (searchDto.key != null) {
      where.set('remark', {
        contains: searchDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundReplays = await this.prisma.rate.findMany({
      where: whe,
    });

    var mainMatches = foundReplays;
    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }
}
