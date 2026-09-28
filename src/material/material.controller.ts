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
  IdParam,
  MaterialFilesUploadPost,
  MaterialFileUploadPatch,
  UploadedSingleFile,
  createMaterialFilesValidationPipe,
} from '../common/decorators/entity-upload.decorator';
import {
  EntityFilesUploadPayload,
  SingleFileUploadPayload,
} from '../common/services/file-storage.service';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() materialDto: MaterialDto) {
    return this.materialService.create(materialDto);
  }

  @MaterialFilesUploadPost('files/:id')
  createFile(
    @IdParam() id: number,
    @UploadedFiles(createMaterialFilesValidationPipe())
    files: EntityFilesUploadPayload,
  ) {
    return this.materialService.createFile(files, id);
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
  findOne(@IdParam() id: number) {
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
  findForSeller(@IdParam() id: number) {
    return this.materialService.findForSeller(id);
  }

  @Get('/paginated_seller_materials/:seller_id')
  getPaginatedSellerMaterials(
    @IdParam('seller_id') seller_id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.materialService.paginateSellerMaterials(seller_id, {
      take: query.take,
      page: query.page,
    });
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@IdParam() id: number, @Body() materialDto: UpdateMaterialDto) {
    return this.materialService.update(id, materialDto as MaterialDto);
  }

  @MaterialFileUploadPatch('updateMainMaterial/:id', 'material')
  updateMaterial(
    @IdParam() id: number,
    @UploadedSingleFile('material', {
      maxSizeBytes: 200 * 1024 * 1024,
    })
    files: SingleFileUploadPayload,
  ) {
    return this.materialService.updateMaterial(files, id);
  }

  @MaterialFileUploadPatch('updateMaterialProfile/:id', 'profile')
  updateMaterialProfile(
    @IdParam() id: number,
    @UploadedSingleFile('profile', {
      allowedMimeTypes: ['image/*'],
    })
    files: SingleFileUploadPayload,
  ) {
    return this.materialService.updateMaterialProfile(files, id);
  }

  @MaterialFileUploadPatch('updateMaterialCover/:id', 'cover')
  updateMaterialCover(
    @IdParam() id: number,
    @UploadedSingleFile('cover', {
      allowedMimeTypes: ['image/*'],
    })
    files: SingleFileUploadPayload,
  ) {
    return this.materialService.updateMaterialCover(files, id);
  }

  @MaterialFileUploadPatch('updateMaterialImage/:id', 'images', 10)
  updateMaterialImage(
    @IdParam() id: number,
    @UploadedSingleFile('images', {
      allowedMimeTypes: ['image/*'],
    })
    files: SingleFileUploadPayload,
  ) {
    return this.materialService.updateMaterialImage(files, id);
  }

  @MaterialFileUploadPatch('updateMaterialPreview/:id', 'preview')
  updateMaterialPreview(
    @IdParam() id: number,
    @UploadedSingleFile('preview', {
      maxSizeBytes: 50 * 1024 * 1024,
    })
    files: SingleFileUploadPayload,
  ) {
    return this.materialService.updateMaterialPreview(files, id);
  }

  @Delete(':id')
  remove(@IdParam() id: number) {
    return this.materialService.remove(id);
  }

  @Get('material/:fileName')
  getMaterial(@Param('fileName') fileName: string, @Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'uploads/material/' + fileName));
  }

  @Get('/material/:id')
  findMaterial(@IdParam() id: number, @Res() res: Response) {
    return this.materialService.showMaterial(id, res);
  }

  @UseGuards(JwtGuard)
  @Get('/purchased/user-materials')
  getPurchasedMaterial(@GetUser() user: User) {
    return this.materialService.getUserMaterial(user);
  }

  @UseGuards(JwtGuard)
  @Get('/user-purchase/:material_id')
  checkUserPurchasedMaterial(
    @IdParam('material_id') material_id: number,
    @GetUser() user: User,
  ) {
    return this.materialService.isMaterialPurchased(user, material_id);
  }

  @Get('material_profile/:id')
  findMaterialProfile(@IdParam() id: number, @Res() res: Response) {
    return this.materialService.showMaterialProfile(id, res);
  }

  @Get('material_cover-name/:id')
  getMaterialCoverImageName(@IdParam() id: number) {
    return this.materialService.getMaterialCoverName(id);
  }

  @Get('material_profile-image/:imageName')
  getMaterialImage(
    @Param('imageName') imageName: string,
    @Res() res: Response,
  ) {
    return res.sendFile(join(process.cwd(), 'uploads/material/' + imageName));
  }

  @Get('material_cover/:id')
  findMaterialCover(@IdParam() id: number, @Res() res: Response) {
    return this.materialService.showMaterialCover(id, res);
  }

  @Get('material_image/:id')
  findMaterialImage(@IdParam() id: number, @Res() res: Response) {
    return this.materialService.showMaterialImage(id, res);
  }

  @Get('material_preview/:id')
  findMaterialPreview(@IdParam() id: number, @Res() res: Response) {
    return this.materialService.showMaterialPreview(id, res);
  }

  @Get('material_preview-images/:material_id')
  getMaterialPreviewImages(@IdParam('material_id') material_id: number) {
    return this.materialService.getMaterialPreviewImages(material_id);
  }
}
