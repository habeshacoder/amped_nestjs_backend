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
  UploadedFile,
  Res,
  ParseFilePipeBuilder,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ChannelMaterialService } from './channel-material.service';
import { ChannelMaterialDto } from './dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  editFileName,
  fileFilter,
  imageFileFilter,
} from '../common/utils/file-upload.utils';
import { Material, Type } from '@prisma/client';
import { join } from 'path';

@Controller('channel-material')
export class ChannelMaterialController {
  constructor(
    private readonly channelMaterialService: ChannelMaterialService,
  ) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() materialDto: ChannelMaterialDto) {
    return this.channelMaterialService.create(materialDto);
  }

  @UseGuards(JwtGuard)
  @Post('files/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'material', maxCount: 1 },
        { name: 'profile', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 10 },
        { name: 'preview', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel/material/',
          filename: editFileName,
        }),
      },
    ),
  )
  createFile(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      material: Express.Multer.File;
      profile: Express.Multer.File;
      cover: Express.Multer.File;
      images: Express.Multer.File;
      preview: Express.Multer.File;
    },
  ) {
    return this.channelMaterialService.createFile(files, +id);
  }

  @Get()
  findAll() {
    return this.channelMaterialService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelMaterialService.findOne(+id);
  }

  @Get('/get_by/:type')
  getMaterialByType(@Param('type') materialType: Type) {
    return this.channelMaterialService.getMaterialByType(materialType);
  }

  @Get('/seller/:id')
  findForSeller(@Param('id') id: string) {
    return this.channelMaterialService.findForSeller(+id);
  }

  // @Get('/channel/:id')
  // findForChannel(@Param('id') id: number) {
  //     return this.materialService.findForChannel(+id);
  // }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() materialDto: ChannelMaterialDto) {
    return this.channelMaterialService.update(+id, materialDto);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterial/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'material', maxCount: 1 },
        // {name: 'profile', maxCount: 1},
        // {name: 'cover', maxCount: 1},
        // {name: 'images', maxCount: 10},
        // {name: 'preview', maxCount: 1}
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel/material/',
          filename: editFileName,
        }),
      },
    ),
  )
  updateMaterial(
    @Param('id') id: string,
    @UploadedFiles() files: { material: Express.Multer.File },
  ) {
    //, profile: Express.Multer.File, cover: Express.Multer.File, images: Express.Multer.File, preview: Express.Multer.File}) {
    return this.channelMaterialService.updateMaterial(files, +id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialProfile/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'material', maxCount: 1 },
        { name: 'profile', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 10 },
        { name: 'preview', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel/material/',
          filename: editFileName,
        }),
      },
    ),
  )
  updateMaterialProfile(
    @Param('id') id: string,
    @UploadedFiles() files: { profile: Express.Multer.File },
  ) {
    //, profile: Express.Multer.File, cover: Express.Multer.File, images: Express.Multer.File, preview: Express.Multer.File}) {
    return this.channelMaterialService.updateMaterialProfile(files, +id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialCover/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'material', maxCount: 1 },
        { name: 'profile', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 10 },
        { name: 'preview', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel/material/',
          filename: editFileName,
        }),
      },
    ),
  )
  updateMaterialCover(
    @Param('id') id: string,
    @UploadedFiles() files: { cover: Express.Multer.File },
  ) {
    // , profile: Express.Multer.File, cover: Express.Multer.File, images: Express.Multer.File, preview: Express.Multer.File}) {
    return this.channelMaterialService.updateMaterialCover(files, +id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialImage/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        // {name: 'material', maxCount: 1},
        // {name: 'profile', maxCount: 1},
        // {name: 'cover', maxCount: 1},
        { name: 'images', maxCount: 10 },
        // {name: 'preview', maxCount: 1}
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel/material/',
          filename: editFileName,
        }),
      },
    ),
  )
  updateMaterialImage(
    @Param('id') id: string,
    @UploadedFiles() files: { images: Express.Multer.File },
  ) {
    //, profile: Express.Multer.File, cover: Express.Multer.File, images: Express.Multer.File, preview: Express.Multer.File}) {
    return this.channelMaterialService.updateMaterialImage(files, +id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialCover/:id')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        // {name: 'material', maxCount: 1},
        // {name: 'profile', maxCount: 1},
        // {name: 'cover', maxCount: 1},
        // {name: 'images', maxCount: 10},
        { name: 'preview', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel/material/',
          filename: editFileName,
        }),
      },
    ),
  )
  updateMaterialPreview(
    @Param('id') id: string,
    @UploadedFiles() files: { preview: Express.Multer.File },
  ) {
    //, profile: Express.Multer.File, cover: Express.Multer.File, images: Express.Multer.File, preview: Express.Multer.File}) {
    return this.channelMaterialService.updateMaterialPreview(files, +id);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelMaterialService.remove(+id);
  }

  //material upload and retrival
  // @Post('upload/material')
  // @UseInterceptors(FileInterceptor('material', {
  //     storage: diskStorage({
  //         destination: './uploads/material/file',
  //         filename: editFileName,
  //     }),
  //     fileFilter: fileFilter,
  // }))
  // //add validators for dimension
  // @HttpCode(HttpStatus.CREATED)
  // createMaterial(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
  //     return this.materialService.uploadMaterial(file, +id);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('material/:fileName')
  getMaterial(@Param('fileName') fileName, @Res() res) {
    return res.sendFile(
      join(process.cwd(), 'uploads/channel/material/' + fileName),
    );
  }
  //add purchased middleware here
  @HttpCode(HttpStatus.OK)
  @Get('material/:id')
  findMaterial(@Param('id') id: string, @Res() res) {
    return this.channelMaterialService.showMaterial(+id, res);
  }

  //material image upload
  // @Post('upload/material_profile')
  // @UseInterceptors(FileInterceptor('profile', {
  //     storage: diskStorage({
  //         destination: './uploads/material/profile',
  //         filename: editFileName,
  //     }),
  //     fileFilter: imageFileFilter,
  // }))
  // //add validators for dimension
  // @HttpCode(HttpStatus.CREATED)
  // createProfile(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
  //     return this.materialService.uploadMaterialProfile(file, +id);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('material_profile/:id')
  findMaterialProfile(@Param('id') id: string, @Res() res) {
    return this.channelMaterialService.showMaterialProfile(+id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_cover-name/:id')
  getMaterialCoverImageName(@Param('id') id: string) {
    return this.channelMaterialService.getMaterialCoverName(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_profile-image/:imageName')
  getMaterialImage(@Param('imageName') imageName, @Res() res) {
    return res.sendFile(
      join(process.cwd(), 'uploads/channel/material/' + imageName),
    );
  }

  // @UseGuards(JwtGuard)
  // @Post('upload/material_cover')
  // @UseInterceptors(FileInterceptor('cover', {
  //     storage: diskStorage({
  //         destination: './uploads/material/cover',
  //         filename: editFileName,
  //     }),
  //     fileFilter: imageFileFilter,
  // }))
  // //add validators for dimension
  // @HttpCode(HttpStatus.CREATED)
  // createCover(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
  //     return this.materialService.uploadMaterialCover(file, +id);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('material_cover/:id')
  findMaterialCover(@Param('id') id: string, @Res() res) {
    return this.channelMaterialService.showMaterialCover(+id, res);
  }

  //multiple images upload
  // @UseGuards(JwtGuard)
  // @Post('upload/material/images')
  // @UseInterceptors(FilesInterceptor('images', 10, {
  //     storage: diskStorage({
  //         destination: './uploads/material/images',
  //         filename: editFileName,
  //     }),
  //     fileFilter: imageFileFilter,
  // }))
  // uploadFile(@UploadedFiles() files: Array<Express.Multer.File>, @Body('id') id: string) {
  //     return this.materialService.uploadMaterialImage(files, +id);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('material_image/:id')
  findMaterialImage(@Param('id') id: string, @Res() res) {
    return this.channelMaterialService.showMaterialImage(+id, res);
  }

  //material preview upload
  // @UseGuards(JwtGuard)
  // @Post('upload/preview')
  // @UseInterceptors(FileInterceptor('preview', {
  //     storage: diskStorage({
  //         destination: './uploads/material/preview',
  //         filename: editFileName,
  //     }),
  //     fileFilter: fileFilter,
  // }))
  // //add validators for dimension
  // @HttpCode(HttpStatus.CREATED)
  // createMaterialPreview(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
  //     return this.materialService.uploadMaterialPreview(file, +id);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('material_preview/:id')
  findMaterialPreview(@Param('id') id: string, @Res() res) {
    return this.channelMaterialService.showMaterialPreview(+id, res);
  }
}
