import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { FavoriteDto } from './dto';
import { FavoriteService } from './favorite.service';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

@Controller('favorite')
export class FavoriteController {
    constructor(private readonly favoriteService: FavoriteService) {}
    
    @UseGuards(JwtGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() favoriteDto: FavoriteDto, @GetUser() user: User) {
        return this.favoriteService.create(favoriteDto, user);
    }

    @Get()
    findAll() {
        return this.favoriteService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.favoriteService.findOne(+id);
    }

    @Get('/user/:user_id')
    findForUser(@Param('user_id') user_id: string) {
        return this.favoriteService.findForUser(user_id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() favoriteDto: FavoriteDto) {
        return this.favoriteService.update(+id, favoriteDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.favoriteService.remove(+id);
    }
}