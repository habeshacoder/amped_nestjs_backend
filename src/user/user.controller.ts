/* eslint-disable prettier/prettier */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('users')
export class UserController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUser() user: User) {
    const u = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        profiles: true,
        seller_profile: true,
        favorite: true,
        rate: true,
      },
    });
    return u;
  }

  @Get('all')
  async getAllUsers() {
    const u = await this.prisma.user.findMany({
      include: {
        profiles: true,
        seller_profile: true,
        favorite: true,
        rate: true,
      },
    });
    return u;
  }
}
