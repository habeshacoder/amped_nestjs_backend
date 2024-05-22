/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { SellerProfilesService } from './seller-profiles.service';
import { SellerProfileDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { UploadedFile, UploadedFiles } from '@nestjs/common/decorators';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  editFileName,
  imageFileFilter,
} from 'src/common/utils/file-upload.utils';

@Controller('seller-profiles')
export class SellerProfilesController {
  constructor(private readonly sellerProfilesService: SellerProfilesService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/sellerProfile/image',
          filename: editFileName,
        }),
        fileFilter: imageFileFilter,
      },
    ),
  )
  create(
    @UploadedFiles()
    files: { image: Express.Multer.File; cover: Express.Multer.File },
    @Body() sellerProfileDto: SellerProfileDto,
    @GetUser() user: User,
  ) {
    return this.sellerProfilesService.create(files, sellerProfileDto, user);
  }

  @Get()
  findAll() {
    return this.sellerProfilesService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  findMe(@GetUser() user: User) {
    return this.sellerProfilesService.findMe(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sellerProfilesService.findOne(+id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  updateSellerInfo(
    @Param('id') id: string,
    @Body() sellerProfileDto: SellerProfileDto,
  ) {
    return this.sellerProfilesService.updateProfileInfo(+id, sellerProfileDto);
  }

  @UseGuards(JwtGuard)
  @Patch('/update_profile-image/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], {
      storage: diskStorage({
        destination: './uploads/sellerProfile/image',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  updateProfileImage(
    @UploadedFiles() files: { image: Express.Multer.File },
    @Param('id') id: string,
  ) {
    return this.sellerProfilesService.updateProfileImage(files, +id);
  }

  @UseGuards(JwtGuard)
  @Patch('/update_cover-image/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }], {
      storage: diskStorage({
        destination: './uploads/sellerProfile/image',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  updateCoverImage(
    @UploadedFiles() files: { cover: Express.Multer.File },
    @Param('id') id: string,
  ) {
    return this.sellerProfilesService.updateCoverImage(files, +id);
  }

  // @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sellerProfilesService.remove(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile-image/:imageName')
  findProfileImage(@Param('imageName') imageName, @Res() res) {
    return res.sendFile(
      join(process.cwd(), 'uploads/sellerProfile/image/' + imageName),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('cover-image/:imageName')
  findCoverImage(@Param('imageName') imageName, @Res() res) {
    return res.sendFile(
      join(process.cwd(), 'uploads/sellerProfile/image/' + imageName),
    );
  }
}
