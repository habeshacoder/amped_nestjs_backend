/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SocialLinksProfileService } from './social-links-profile.service';
import { SocialLinksProfileDto } from './dto';
import { JwtGuard } from '../auth/guard';


@Controller('social-links-profile')
export class SocialLinksProfileController {
    constructor(private readonly socialLinksProfileService: SocialLinksProfileService) {}

    @UseGuards(JwtGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() socialLinksProfileDto: SocialLinksProfileDto) {
        return this.socialLinksProfileService.create(socialLinksProfileDto);
    }

    @Get()
    findAll() {
        return this.socialLinksProfileService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.socialLinksProfileService.findOne(+id);
    }

    @Get('seller_profile/:sellerprofile_id')
    getSellerSocialLinks(@Param('sellerprofile_id') sellerprofile_id: string) {
        return this.socialLinksProfileService.getSellerSocialLinks(+sellerprofile_id);
    }

    @UseGuards(JwtGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() socialLinksProfileDto: SocialLinksProfileDto) {
        return this.socialLinksProfileService.update(+id, socialLinksProfileDto);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.socialLinksProfileService.remove(+id);
    }
}
