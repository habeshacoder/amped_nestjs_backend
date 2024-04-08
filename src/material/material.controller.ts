/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, Res, UploadedFiles, Query, Header } from '@nestjs/common';
import { Headers } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialDto } from './dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from '../common/utils/file-upload.utils';
import { Catagory, Material, Type, User } from '@prisma/client';
import { join } from 'path';
import { GetUser } from 'src/auth/decorator';
import { statSync, createReadStream } from 'fs';
import { Response } from 'express';

@Controller('material')
export class MaterialController {
    constructor(private readonly materialService: MaterialService) { }

    @UseGuards(JwtGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() materialDto: MaterialDto) {
        return this.materialService.create(materialDto);
    }

    @UseGuards(JwtGuard)
    @Post('files/:id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'material', maxCount: 1 },
        { name: 'profile', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 10 },
        { name: 'preview', maxCount: 1 }
    ], {
        storage: diskStorage({
            destination: './uploads/material/',
            filename: editFileName
        })
    }))
    createFile(@Param('id') id: string, @UploadedFiles() files: { material: Express.Multer.File, profile: Express.Multer.File, cover: Express.Multer.File, images: Express.Multer.File, preview: Express.Multer.File }) {
        return this.materialService.createFile(files, +id);
    }

    @Get()
    findAll() {
        return this.materialService.findAll();
    }

    @Get('/audio-streaming/:fileName')
    @Header('Accept-Ranges', 'bytes')
    @Header('Content-Type', 'audio/mpeg')
    async audioStreaming(@Param('fileName') fileName: string, @Headers() headers, @Res() res:Response) {
        const audioPath = join(process.cwd(), 'uploads/material/' + fileName);
        const { size } = statSync(audioPath);
        const audioRange = headers.range;
        if (audioRange) {
            const parts = audioRange.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
            const chunksize = (end - start) + 1;
            const readStreamfile = createReadStream(audioPath, { start, end, highWaterMark: 60 });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${size}`,
                'Content-Length': chunksize,
            };
            res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
            readStreamfile.pipe(res);
        } else {
            const head = {
                'Content-Length': size,
            };
            res.writeHead(HttpStatus.OK, head);//200
            createReadStream(audioPath).pipe(res);
        }
    }

    @Get('/epub-streaming/:fileName')
    @Header('Accept-Ranges', 'bytes')
    @Header('Content-Type', 'application/epub+zip')
    async epubStreaming(@Param('fileName') fileName: string, @Headers() headers, @Res() res:Response) {
        const audioPath = join(process.cwd(), 'uploads/material/' + fileName);
        const { size } = statSync(audioPath);
        const audioRange = headers.range;
        if (audioRange) {
            const parts = audioRange.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
            const chunksize = (end - start) + 1;
            const readStreamfile = createReadStream(audioPath, { start, end, highWaterMark: 60 });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${size}`,
                'Content-Length': chunksize,
            };
            res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
            readStreamfile.pipe(res);
        } else {
            const head = {
                'Content-Length': size,
            };
            res.writeHead(HttpStatus.OK, head);//200
            createReadStream(audioPath).pipe(res);
        }
    }

    @Get('/materials_web')
    getMaterialsWeb(@Query('take') take: string, @Query('page') page: string) {
        return this.materialService.getMaterialsWeb({ take: Number(take), page: Number(page) });
    }

    @Get('/paginate_by_type/:type')
    paginateMaterialByType(@Param('type') materialType: string, @Query('take') take: string, @Query('page') page: string) {
        return this.materialService.paginateMaterialByType(materialType, { take: Number(take), page: Number(page) });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.materialService.findOne(+id);
    }
    
    @Get('/home')
    getHomeItems() {
        return this.materialService.getHomeItems()
    }

    @Get('/get_by/:type')
    getMaterialByType(@Param('type') materialType: Type) {
        return this.materialService.getMaterialByType(materialType)
    }

    @Get('/get_by_catagory/:catagory')
    getMaterialByCatagory(@Param('catagory') catagory: Catagory) {
        return this.materialService.getMaterialByCatagory(catagory)
    }

    @Get('/get_by_publication_year/:pub_year')
    getMaterialByPublicationYear(@Param('pub_year') pub_year: string) {
        return this.materialService.getMaterialByPublicationYear(pub_year)
    }

    @Get('/materials_mob')
    getMaterialsMob(@Query('take') take: string): Promise<Material[]> {
        return this.materialService.getMaterialsMob({ take: Number(take) });
    }

    @Get('/seller/:id')
    findForSeller(@Param('id') id: string) {
        return this.materialService.findForSeller(+id);
    }

    @Get('/paginated_seller_materials/:seller_id')
    getPaginatedSellerMaterials(@Param('seller_id') seller_id: string, @Query('take') take: string, @Query('page') page: string) {
        return this.materialService.paginateSellerMaterials(+seller_id, { take: Number(take), page: Number(page) });
    }

    @UseGuards(JwtGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() materialDto: MaterialDto) {
        return this.materialService.update(+id, materialDto);
    }

    @UseGuards(JwtGuard)
    @Patch('updateMainMaterial/:id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'material', maxCount: 1 }
    ], {
        storage: diskStorage({
            destination: './uploads/material/',
            filename: editFileName
        })
    }))
    updateMaterial(@Param('id') id: string, @UploadedFiles() files: { material: Express.Multer.File }) {
        return this.materialService.updateMaterial(files, +id);
    }

    @UseGuards(JwtGuard)
    @Patch('updateMaterialProfile/:id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'profile', maxCount: 1 },
    ], {
        storage: diskStorage({
            destination: './uploads/material/',
            filename: editFileName
        })
    }))
    updateMaterialProfile(@Param('id') id: string, @UploadedFiles() files: { profile: Express.Multer.File }) {
        return this.materialService.updateMaterialProfile(files, +id);
    }

    @UseGuards(JwtGuard)
    @Patch('updateMaterialCover/:id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'cover', maxCount: 1 }
    ], {
        storage: diskStorage({
            destination: './uploads/material/',
            filename: editFileName
        })
    }))
    updateMaterialCover(@Param('id') id: string, @UploadedFiles() files: { cover: Express.Multer.File }) {
        return this.materialService.updateMaterialCover(files, +id);
    }

    @UseGuards(JwtGuard)
    @Patch('updateMaterialImage/:id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'images', maxCount: 10 }
    ], {
        storage: diskStorage({
            destination: './uploads/material/',
            filename: editFileName
        })
    }))
    updateMaterialImage(@Param('id') id: string, @UploadedFiles() files: { images: Express.Multer.File }) {
        return this.materialService.updateMaterialImage(files, +id);
    }

    @UseGuards(JwtGuard)
    @Patch('updateMaterialPreview/:id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'preview', maxCount: 1 }
    ], {
        storage: diskStorage({
            destination: './uploads/material/',
            filename: editFileName
        })
    }))
    updateMaterialPreview(@Param('id') id: string, @UploadedFiles() files: { preview: Express.Multer.File }) {
        return this.materialService.updateMaterialPreview(files, +id);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.materialService.remove(+id);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material/:fileName')
    getMaterial(@Param('fileName') fileName, @Res() res) {
        return (res.sendFile(join(process.cwd(), 'uploads/material/' + fileName)));
    }

    //add purchased middleware here
    @HttpCode(HttpStatus.OK)
    @Get('/material/:id')
    findMaterial(@Param('id') id: string, @Res() res) {
        return this.materialService.showMaterial(+id, res);
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
    checkUserPurchasedMaterial(@Param('material_id') material_id: string, @GetUser() user: User) {
        return this.materialService.isMaterialPurchased(user, +material_id);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_profile/:id')
    findMaterialProfile(@Param('id') id: string, @Res() res) {
        return this.materialService.showMaterialProfile(+id, res);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_cover-name/:id')
    getMaterialCoverImageName(@Param('id') id: string) {
        return this.materialService.getMaterialCoverName(+id);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_profile-image/:imageName')
    getMaterialImage(@Param('imageName') imageName, @Res() res) {
        return (res.sendFile(join(process.cwd(), 'uploads/material/' + imageName)));
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_cover/:id')
    findMaterialCover(@Param('id') id: string, @Res() res) {
        return this.materialService.showMaterialCover(+id, res);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_image/:id')
    findMaterialImage(@Param('id') id: string, @Res() res) {
        return this.materialService.showMaterialImage(+id, res);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_preview/:id')
    findMaterialPreview(@Param('id') id: string, @Res() res) {
        return this.materialService.showMaterialPreview(+id, res);
    }

    @HttpCode(HttpStatus.OK)
    @Get('material_preview-images/:material_id')
    getMaterialPreviewImages(@Param('material_id') material_id: string) {
        return this.materialService.getMaterialPreviewImages(+material_id);
    }
}
