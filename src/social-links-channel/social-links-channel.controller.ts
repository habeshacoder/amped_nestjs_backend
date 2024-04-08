import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { SocialLinksChannelService } from './social-links-channel.service';
import { SocialLinksChannelDto } from './dto';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('social-links-channel')
export class SocialLinksChannelController {
    constructor(private readonly socialLinksChannelService: SocialLinksChannelService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() socialLinksChannelDto: SocialLinksChannelDto) {
        return this.socialLinksChannelService.create(socialLinksChannelDto);
    }

    @Get()
    findAll() {
        return this.socialLinksChannelService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.socialLinksChannelService.findOne(+id);
    }

    @Get('profile/:id')
    findForChannel(@Param('id') id: string) {
        return this.socialLinksChannelService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() socialLinksChannelDto: SocialLinksChannelDto) {
        return this.socialLinksChannelService.update(+id, socialLinksChannelDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.socialLinksChannelService.remove(+id);
    }
}
