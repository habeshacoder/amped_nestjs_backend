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
  Query,
  Header,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import {
  MaterialDto,
  UpdateMaterialDto,
  PaginationQueryDto,
  TakeQueryDto,
} from './dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { Catagory, Material, Parent, Type, User } from '@prisma/client';
import { join } from 'path';
import { GetUser } from '../auth/decorator';
import { streamByteRange } from '../common/utils/range-stream.util';
import { Response } from 'express';
import {
  MaterialFilesUploadInterceptor,
  SingleFileUploadInterceptor,
  createMaterialFilesValidationPipe,
  createSingleFileValidationPipe,
} from '../common/decorators/entity-upload.decorator';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() materialDto: MaterialDto) {
    return this.materialService.create(materialDto);
  }

  @UseGuards(JwtGuard)
  @Post('files/:id')
  @HttpCode(HttpStatus.CREATED)
  @MaterialFilesUploadInterceptor('material')
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
    return this.materialService.createFile(files as any, id);
  }

  @Get()
  findAll() {
    return this.materialService.findAll();
  }

  @Get('/audio-streaming/:fileName')
  @Header('Accept-Ranges', 'bytes')
  @Header('Content-Type', 'audio/mpeg')
  async audioStreaming(
    @Param('fileName') fileName: string,
    @Headers('range') audioRange: string | undefined,
    @Res() res: Response,
  ) {
    const audioPath = join(process.cwd(), 'uploads/material/' + fileName);
    streamByteRange(audioPath, audioRange, res);
  }

  @Get('/epub-streaming/:fileName')
  @Header('Accept-Ranges', 'bytes')
  @Header('Content-Type', 'application/epub+zip')
  async epubStreaming(
    @Param('fileName') fileName: string,
    @Headers('range') audioRange: string | undefined,
    @Res() res: Response,
  ) {
    const audioPath = join(process.cwd(), 'uploads/material/' + fileName);
    streamByteRange(audioPath, audioRange, res);
  }

  @Get('/materials_web')
  getMaterialsWeb(@Query() query: PaginationQueryDto) {
    return this.materialService.getMaterialsWeb({
      take: query.take,
      page: query.page,
    });
  }

  @Get('/paginate_by_type/:type')
  paginateMaterialByType(
    @Param('type') materialType: Type,
    @Query() query: PaginationQueryDto,
  ) {
    return this.materialService.paginateMaterialByType(materialType, {
      take: query.take,
      page: query.page,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.findOne(id);
  }

  @Get('/home')
  getHomeItems() {
    return this.materialService.getHomeItems();
  }

  @Get('/get_by/:type')
  getMaterialByType(@Param('type') materialType: Type) {
    return this.materialService.getMaterialByType(materialType);
  }

  @Get('/materials_by/:parent')
  getMaterialByParent(@Param('parent') materialParent: Parent) {
    return this.materialService.getMaterialByParent(materialParent);
  }

  @Get('/get_by_catagory/:catagory')
  getMaterialByCatagory(@Param('catagory') catagory: Catagory) {
    return this.materialService.getMaterialByCatagory(catagory);
  }

  @Get('/get_by_publication_year/:pub_year')
  getMaterialByPublicationYear(@Param('pub_year') pub_year: string) {
    return this.materialService.getMaterialByPublicationYear(pub_year);
  }

  @Get('/materials_mob')
  getMaterialsMob(@Query() query: TakeQueryDto): Promise<Material[]> {
    return this.materialService.getMaterialsMob({ take: query.take });
  }

  @Get('/seller/:id')
  findForSeller(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.findForSeller(id);
  }

  @Get('/paginated_seller_materials/:seller_id')
  getPaginatedSellerMaterials(
    @Param('seller_id', ParseIntPipe) seller_id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.materialService.paginateSellerMaterials(seller_id, {
      take: query.take,
      page: query.page,
    });
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() materialDto: UpdateMaterialDto,
  ) {
    return this.materialService.update(id, materialDto as MaterialDto);
  }

  @UseGuards(JwtGuard)
  @Patch('updateMainMaterial/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('material', 'material')
  updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('material', {
        maxSizeBytes: 200 * 1024 * 1024,
      }),
    )
    files: { material?: Express.Multer.File[] },
  ) {
    return this.materialService.updateMaterial(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Patch('updateMaterialProfile/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('profile', 'material')
  updateMaterialProfile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('profile', {
        allowedMimeTypes: ['image/*'],
      }),
    )
    files: { profile?: Express.Multer.File[] },
  ) {
    return this.materialService.updateMaterialProfile(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Patch('updateMaterialCover/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('cover', 'material')
  updateMaterialCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('cover', {
        allowedMimeTypes: ['image/*'],
      }),
    )
    files: { cover?: Express.Multer.File[] },
  ) {
    return this.materialService.updateMaterialCover(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Patch('updateMaterialImage/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('images', 'material', 10)
  updateMaterialImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('images', {
        allowedMimeTypes: ['image/*'],
      }),
    )
    files: { images?: Express.Multer.File[] },
  ) {
    return this.materialService.updateMaterialImage(files as any, id);
  }

  @UseGuards(JwtGuard)
  @Patch('updateMaterialPreview/:id')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUploadInterceptor('preview', 'material')
  updateMaterialPreview(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      createSingleFileValidationPipe('preview', {
        maxSizeBytes: 50 * 1024 * 1024,
      }),
    )
    files: { preview?: Express.Multer.File[] },
  ) {
    return this.materialService.updateMaterialPreview(files as any, id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.remove(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material/:fileName')
  getMaterial(@Param('fileName') fileName: string, @Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'uploads/material/' + fileName));
  }

  @HttpCode(HttpStatus.OK)
  @Get('/material/:id')
  findMaterial(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.materialService.showMaterial(id, res);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/purchased/user-materials')
  getPurchasedMaterial(@GetUser() user: User) {
    return this.materialService.getUserMaterial(user);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/user-purchase/:material_id')
  checkUserPurchasedMaterial(
    @Param('material_id', ParseIntPipe) material_id: number,
    @GetUser() user: User,
  ) {
    return this.materialService.isMaterialPurchased(user, material_id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_profile/:id')
  findMaterialProfile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.materialService.showMaterialProfile(id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_cover-name/:id')
  getMaterialCoverImageName(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.getMaterialCoverName(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_profile-image/:imageName')
  getMaterialImage(
    @Param('imageName') imageName: string,
    @Res() res: Response,
  ) {
    return res.sendFile(join(process.cwd(), 'uploads/material/' + imageName));
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_cover/:id')
  findMaterialCover(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.materialService.showMaterialCover(id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_image/:id')
  findMaterialImage(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.materialService.showMaterialImage(id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_preview/:id')
  findMaterialPreview(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.materialService.showMaterialPreview(id, res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('material_preview-images/:material_id')
  getMaterialPreviewImages(
    @Param('material_id', ParseIntPipe) material_id: number,
  ) {
    return this.materialService.getMaterialPreviewImages(material_id);
  }
}
