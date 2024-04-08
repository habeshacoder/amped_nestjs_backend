/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Res, UploadedFiles, Query } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { editFileName, fileFilter, imageFileFilter } from '../common/utils/file-upload.utils';
import { ChannelService } from './channel.service';
import { ChannelDto } from './dto';
import { join } from 'path';


@Controller('channel')
export class ChannelController {
    constructor(private readonly channelService: ChannelService) {}

    @UseGuards(JwtGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
            { name: 'profile', maxCount: 1},
            { name: 'cover', maxCount: 1},
        ],{
            storage: diskStorage({
                destination: './uploads/channel/',
                filename: editFileName
            }),
            fileFilter: imageFileFilter
        }
    ))
    create(@UploadedFiles() files: {profile: Express.Multer.File, cover: Express.Multer.File}, @Body() channelDto: ChannelDto) {
        return this.channelService.create(files, channelDto);
    }

    @Get()
    findAll() {
        return this.channelService.findAll();
    }
    @Get('/paginate_channels')
    paginateChannels(@Query('take') take: string, @Query('page') page: string) {
        return this.channelService.paginateChannels({ take: Number(take), page: Number(page) });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.channelService.findOne(+id);
    }

    @Get('/my_channel/:seller_id')
    findMyChannel(@Param('seller_id') id: string) {
        return this.channelService.getMyChannels(+id);
    }
    
    @Get('new_channels')
    getNewChannels() {
        return this.channelService.newChannels();
    }

    @Get('/seller/:id')
    findForSeller(@Param('id') id: string) {
        return this.channelService.findForSeller(+id);
    }

    @Get('/sellerDraft/:id')
    findDraftForSeller(@Param('id') id: string) {
        return this.channelService.findDraftForSeller(+id);
    }

    // @Get('/material/:id')
    // findChannelMaterials(@Param('id') id: number) {
    //     return this.channelService.findChannelMaterials(+id);
    // }

    @Patch(':id')
    update(@Param('id') id: string, @Body() channelDto: ChannelDto) {
        return this.channelService.update(+id, channelDto);
    }

    @UseGuards(JwtGuard)
    @Patch('channel_profile-image/:channel_id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
            { name: 'profile', maxCount: 1},
        ],{
            storage: diskStorage({
                destination: './uploads/channel/',
                filename: editFileName
            }),
            fileFilter: imageFileFilter
        }
    ))
    updateChannelProfileImage(@UploadedFiles() files: {profile: Express.Multer.File}, @Param('channel_id') channel_id: string) {
        return this.channelService.updateChannelProfileImage(files, +channel_id);
    }

    @UseGuards(JwtGuard)
    @Patch('channel_cover-image/:channel_id')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
            { name: 'cover', maxCount: 1},
        ],{
            storage: diskStorage({
                destination: './uploads/channel/',
                filename: editFileName
            }),
            fileFilter: imageFileFilter
        }
    ))
    updateChannelCoverImage(@UploadedFiles() files: {cover: Express.Multer.File}, @Param('channel_id') channel_id: string) {
        return this.channelService.updateChannelCoverImage(files, +channel_id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.channelService.remove(+id);
    }

    //channel image upload
    // @Post('upload/channel_profile')
    // @UseInterceptors(FileInterceptor('profile', {
    //     storage: diskStorage({
    //         destination: './uploads/channel/profile',
    //         filename: editFileName,
    //     }),
    //     fileFilter: imageFileFilter,
    // }))
    // //add validators for dimension 
    // @UseGuards(JwtGuard)
    // @HttpCode(HttpStatus.CREATED)
    // createProfile(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
    //     return this.channelService.uploadChannelProfile(file, +id);
    // }

    @HttpCode(HttpStatus.OK)
    @Get('channel_profile/:id')
    findChannelProfile(@Param('id') id: string, @Res() res) {
        return this.channelService.showChannelProfile(+id, res);
    } 

    // GET CHANNEL IMAGE BY IMAGE NAME 06/21/
    @HttpCode(HttpStatus.OK)
    @Get('channel_profile_image/:imageName')
    findProfileImage(@Param('imageName') imageName, @Res() res) {
        return (res.sendFile(join(process.cwd(), 'uploads/channel/' + imageName)));
    }

    // @Post('upload/channel_cover')
    // @UseInterceptors(FileInterceptor('cover', {
    //     storage: diskStorage({
    //         destination: './uploads/channel/cover',
    //         filename: editFileName,
    //     }),
    //     fileFilter: imageFileFilter,
    // }))
    // //add validators for dimension
    // @UseGuards(JwtGuard)
    // @HttpCode(HttpStatus.CREATED)
    // createCover(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
    //     return this.channelService.uploadChannelCover(file, +id);
    // }

    @HttpCode(HttpStatus.OK)
    @Get('channel_cover/:id')
    findChannelCover(@Param('id') id: string, @Res() res) {
        return this.channelService.showChannelCover(+id, res);
    }

    //multiple images upload
    @UseGuards(JwtGuard)
    @Post('upload/channel/images')
    @UseInterceptors(FilesInterceptor('images', 10, {
        storage: diskStorage({
            destination: './uploads/channel/images',
            filename: editFileName,
        }),
        fileFilter: imageFileFilter,
    }))
    uploadFile(@UploadedFiles() files: Array<Express.Multer.File>, @Body('id') id: string) {
        return this.channelService.uploadChannelImage(files, +id);
    }

    @HttpCode(HttpStatus.OK)
    @Get('channel_image/:id')
    findChannelImage(@Param('id') id: string, @Res() res) {
        return this.channelService.showChannelImage(+id, res);
    }    

    @HttpCode(HttpStatus.OK)
    @Get('cover_image-name/:id')
    getChannelCoverImage(@Param('id') id: string) {
        return this.channelService.getChannelCoverImageName(+id);
    } 

    //channel preview upload
    @Post('upload/preview')
    @UseInterceptors(FileInterceptor('preview', {
        storage: diskStorage({
            destination: './uploads/channel/preview',
            filename: editFileName,
        }),
        fileFilter: fileFilter,
    }))
    //add validators for dimension
    @HttpCode(HttpStatus.CREATED)
    createChannelPreview(@UploadedFile() file: Express.Multer.File, @Body('id') id: string) {
        return this.channelService.uploadChannelPreview(file, +id);
    }

    @HttpCode(HttpStatus.OK)
    @Get('channel_preview/:id')
    findChannelPreview(@Param('id') id: string, @Res() res) {
        return this.channelService.showChannelPreview(+id, res);
    }    
}
