/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfileDto, UpdateDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common/decorators';
import { diskStorage } from 'multer';
import { join } from 'path';
import {
  editFileName,
  imageFileFilter,
} from 'src/common/utils/file-upload.utils';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/profile/profile',
          filename: editFileName,
        }),
        fileFilter: imageFileFilter,
      },
    ),
  )
  create(
    @UploadedFiles()
    files: { profile: Express.Multer.File; cover: Express.Multer.File },
    @Body() ProfileDto: ProfileDto,
    @GetUser() user: User,
  ) {
    return this.profilesService.create(files, ProfileDto, user);
  }

  @Get()
  findAll() {
    return this.profilesService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  findMe(@GetUser() user: User) {
    return this.profilesService.findMe(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(+id);
  }

  @Get('user_profile/:user_id')
  findUserProfileByUserId(@Param('user_id') userId: string) {
    return this.profilesService.findProfileByUserId(userId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Patch('update_password')
  updatePassword(@Body() dto: UpdateDto, @GetUser() user: User) {
    return this.profilesService.updatePassword(dto, user);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  updateProfileInfo(@Param('id') id: string, @Body() ProfileDto: ProfileDto) {
    return this.profilesService.updateProfile(+id, ProfileDto);
  }

  @UseGuards(JwtGuard)
  @Patch('profile_image/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profile', maxCount: 1 }], {
      storage: diskStorage({
        destination: './uploads/profile/profile',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  updateProfileImage(
    @UploadedFiles() profileImage: { profile: Express.Multer.File },
    @Param('id') id: string,
  ) {
    return this.profilesService.updateProfileImage(profileImage, +id);
  }

  @UseGuards(JwtGuard)
  @Patch('cover_imege/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }], {
      storage: diskStorage({
        destination: './uploads/profile/profile',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  updateCoverImage(
    @UploadedFiles() files: { cover: Express.Multer.File },
    @Param('id') id: string,
  ) {
    return this.profilesService.updateCoverImage(files, +id);
  }

  // @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profilesService.remove(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile-image/:imageName')
  findProfileImage(@Param('imageName') imageName, @Res() res) {
    return res.sendFile(
      join(process.cwd(), './uploads/profile/profile/' + imageName),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('cover-image/:imageName')
  findCoverImage(@Param('imageName') imageName, @Res() res) {
    return res.sendFile(
      join(process.cwd(), './uploads/profile/profile/' + imageName),
    );
  }
}
