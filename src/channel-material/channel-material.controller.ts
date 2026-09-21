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
  Res,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { ChannelMaterialService } from './channel-material.service';
import { Response } from 'express';
import { ChannelMaterialDto } from './dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { Type } from '@prisma/client';
import { join } from 'path';
import {
  MaterialFilesUploadInterceptor,
  SingleFileUploadInterceptor,
  createMaterialFilesValidationPipe,
  createSingleFileValidationPipe,
} from '../common/decorators/entity-upload.decorator';

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
  @MaterialFilesUploadInterceptor('channel/material')
  createFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(createMaterialFilesValidationPipe())
    files: {
      material?: Express.Multer.File[];
      profile?: Express.Multer.File[];
      cover?: Express.Multer.File[];
      images?: Express.Multer.File[];
      preview?: Express.Multer.File[];
    },
  ) {
    return this.channelMaterialService.createFile(files as any, id);
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

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() materialDto: ChannelMaterialDto) {
    return this.channelMaterialService.update(+id, materialDto);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterial/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('material', 'channel/material')
  updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('material', {
        maxSizeBytes: 200 * 1024 * 1024,
      }),
    )
    files: { material?: Express.Multer.File[] },
  ) {
    return this.channelMaterialService.updateMaterial(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialProfile/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('profile', 'channel/material')
  updateMaterialProfile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('profile', {
        allowedMimeTypes: ['image/*'],
      }),
    )
    files: { profile?: Express.Multer.File[] },
  ) {
    return this.channelMaterialService.updateMaterialProfile(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialCover/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('cover', 'channel/material')
  updateMaterialCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('cover', {
        allowedMimeTypes: ['image/*'],
      }),
    )
    files: { cover?: Express.Multer.File[] },
  ) {
    return this.channelMaterialService.updateMaterialCover(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialImage/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('images', 'channel/material', 10)
  updateMaterialImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('images', {
        allowedMimeTypes: ['image/*'],
      }),
    )
    files: { images?: Express.Multer.File[] },
  ) {
    return this.channelMaterialService.updateMaterialImage(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Post('updateMaterialCover/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('preview', 'channel/material')
  updateMaterialPreview(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('preview', {
        maxSizeBytes: 50 * 1024 * 1024,
      }),
    )
    files: { preview?: Express.Multer.File[] },
  ) {
    return this.channelMaterialService.updateMaterialPreview(files as any, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelMaterialService.remove(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material/:fileName')
  getMaterial(@Param('fileName') fileName: string, @Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'uploads/channel/material/' + fileName),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('material/:id')
  findMaterial(@Param('id') id: string, @Res() res: Response) {
    return this.channelMaterialService.showMaterial(+id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_profile/:id')
  findMaterialProfile(@Param('id') id: string, @Res() res: Response) {
    return this.channelMaterialService.showMaterialProfile(+id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_cover-name/:id')
  getMaterialCoverImageName(@Param('id') id: string) {
    return this.channelMaterialService.getMaterialCoverName(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_profile-image/:imageName')
  getMaterialImage(
    @Param('imageName') imageName: string,
    @Res() res: Response,
  ) {
    return res.sendFile(
      join(process.cwd(), 'uploads/channel/material/' + imageName),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_cover/:id')
  findMaterialCover(@Param('id') id: string, @Res() res: Response) {
    return this.channelMaterialService.showMaterialCover(+id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_image/:id')
  findMaterialImage(@Param('id') id: string, @Res() res: Response) {
    return this.channelMaterialService.showMaterialImage(+id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_preview/:id')
  findMaterialPreview(@Param('id') id: string, @Res() res: Response) {
    return this.channelMaterialService.showMaterialPreview(+id, res);
  }
}
