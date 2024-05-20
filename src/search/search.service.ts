/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDto, SearchChannelDto } from './dto';
import { SearchUserDto } from './dto/searchUser.dto';

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

  async suggestChannel(searchChannelDto: SearchChannelDto) {
    const where = new Map<string, unknown>();

    if (searchChannelDto.key != null) {
      where.set('name', {
        contains: searchChannelDto.key,
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
  async suggestUser(searchUserDto: SearchUserDto) {
    const where = new Map<string, unknown>();

    if (searchUserDto.key != null) {
      where.set('username', {
        contains: searchUserDto.key,
        mode: 'insensitive',
      });
    }

    var whe = Object.fromEntries(where);

    const foundChannel = await this.prisma.user.findMany({
      where: whe,
    });

    var mainMatches = foundChannel;

    return {
      mainMatches,
      message: 'Matches returned successfully.',
      success: true,
    };
  }
}
