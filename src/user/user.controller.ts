/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeleteUserDto } from './dto/delete_user.dto';

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
      },
    });
    return u;
  }

  @Delete('delete')
  async deleteUser(@Body() deleteUserDto: DeleteUserDto) {
    console.log(deleteUserDto.email);
    const user = await this.prisma.user.findFirst({
      where: {
        email: deleteUserDto.email,
      },
    });

    if (user) {
      //remove all related data like file, images and preview
      try {
        const user = await this.prisma.user.delete({
          where: {
            email: deleteUserDto.email,
          },
        });

        if (user) {
          return { message: 'user deleted successfully' };
        }
      } catch (error) {
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't delete while there is no user. Please create a material first.",
      );
    }
  }
}
