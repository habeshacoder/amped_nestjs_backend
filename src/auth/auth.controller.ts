/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
} from '@nestjs/common';
import { Request } from 'express';
import { Query, Req, UseGuards } from '@nestjs/common/decorators';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ResetDto } from './dto';
import { JwtGuard, RefreshTokenGuard } from './guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: RegisterDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: LoginDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtGuard)
  @Get('logout')
  logout(@Req() req: Request) {
    return this.authService.logout(req.user['id']);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  refreshTokens(@Req() req: Request) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }

  // @UseGuards(RefreshTokenGuard)
  @Get('users')
  findAll() {
    return this.authService.findAll();
  }
}
