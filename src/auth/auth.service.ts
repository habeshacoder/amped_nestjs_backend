/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ResetDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config/dist/config.service';
// import { MailService } from "../mail/mail.service";
import { OAuth2Client } from 'google-auth-library';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService, // private mailService: MailService,
  ) {}

  async signup(dto: RegisterDto) {
    //generate the password
    const hash = await this.hashData(dto.password);
    try {
      //save the user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          username: dto.username,
          phone: dto.phoneNo,
          is_active: true,
        },
      });

      const body = {
        sub: user.id,
        email: user.email,
        name: user.username,
      };

      const secret = this.config.get('JWT_SECRET');

      const token = await this.jwt.signAsync(body, {
        expiresIn: '60m',
        secret: secret,
      });

      // token = await argon.hash(user.id + user.username + user.created_at + "_" + );//consider expiration

      //send an email
      // await this.mailService.sendUserConfirmation(user.email, user.username, token);
      //return the user
      const tokens = await this.getTokens(user.id, user.username, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;

      // return this.signToken(user.id, user.email, user.is_verified);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials Taken');
        }
      }
      throw error;
    }
  }

  async signin(dto: LoginDto) {
    //find user by ID
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    //if user doesn't exist throw error
    if (!user) {
      throw new ForbiddenException('Wrong Email Try Again');
    } else if (user.provider !== 'local' && user.provider !== 'all') {
      throw new ForbiddenException(
        'User is not registered via Email auth provider. Please try another way.',
      );
    }
    //compare password
    const pwMatches = await argon.verify(user.password, dto.password);
    // if incorrect password throw error
    if (!pwMatches) {
      throw new ForbiddenException('Wrong Password Please Try Again');
    }
    //return user
    const tokens = await this.getTokens(user.id, user.username, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    // console.log(userId);
    this.updateRefreshToken(userId, '');
    const updatedUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return updatedUser;
  }

  async signToken(
    userId: string,
    email: string,
    is_verified: boolean,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
      is_verified: is_verified,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }

  hashData(data: string) {
    return argon.hash(data);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refresh_token: hashedRefreshToken,
      },
    });
    // await this.usersService.update(userId, {
    //     refreshToken: hashedRefreshToken,
    // });
  }

  async getTokens(userId: string, username: string, userEmail: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          username,
          userEmail,
        },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: '2d',
        },
      ),
      this.jwt.signAsync(
        {
          sub: userId,
          username,
          userEmail,
        },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: '2d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.refresh_token) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await argon.verify(
      user.refresh_token,
      refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.username, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
  async findAll() {
    const profiles = await this.prisma.user.findMany({
      include: {
        seller_profile: true,
        profiles: true,
      },
    });

    if (profiles) {
      return profiles;
    } else {
      return { message: 'No profile found.' };
    }
  }
}
