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
import {
  RegisterDto,
  LoginDto,
  ForgetDto,
  ResetDto,
  ResetPhoneDto,
} from './dto';
import {
  GoogleGuard,
  FacebookGuard,
  JwtGuard,
  RefreshTokenGuard,
} from './guard';

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

  @HttpCode(HttpStatus.OK)
  @Get('confirm')
  verify(@Query() token: any) {
    return this.authService.verify(token.t);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('reset_password')
  reset(@Body() dto: ResetDto) {
    return this.authService.reset(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  refreshTokens(@Req() req: Request) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
