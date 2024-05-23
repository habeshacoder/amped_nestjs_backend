/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingDto } from './dto';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { GetUser } from 'src/auth/decorator';

@Controller('rate')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() ratingDto: RatingDto, @GetUser() user: User) {
    return this.ratingService.create(ratingDto, user);
  }

  @Get()
  findAll() {
    return this.ratingService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get('my_review')
  myReview(@GetUser() user: User) {
    return this.ratingService.getMyReview(user);
  }

  @UseGuards(JwtGuard)
  @Get('by_rate-no/:rating')
  getByRatingNo(@GetUser() user: User, @Param('rating') rating: string) {
    return this.ratingService.getByRatingNo(user, +rating);
  }

  @Get('review/:id')
  findOne(@Param('id') id: string) {
    return this.ratingService.findOne(+id);
  }

  @UseGuards(JwtGuard)
  @Get('my_material_review/:material_id')
  myMaterialReview(
    @Param('material_id') materialId: string,
    @GetUser() user: User,
  ) {
    return this.ratingService.getMyMaterialReview(+materialId, user);
  }

  @UseGuards(JwtGuard)
  @Get('my_channel_review/:channel_id')
  myChannelReview(
    @Param('channel_id') channelId: string,
    @GetUser() user: User,
  ) {
    return this.ratingService.getMyChannelReview(+channelId, user);
  }

  @Get('material/:material_id')
  materialRating(@Param('material_id') material_id: string) {
    return this.ratingService.materialRating(+material_id);
  }

  @Get('channel/:channel_id')
  channelRating(@Param('channel_id') channel_id: string) {
    return this.ratingService.channelRating(+channel_id);
  }

  @Get('rating/material_rating')
  noOfMaterialRating(
    @Query('rating') rating: string,
    @Query('material_id') material_id: string,
  ) {
    return this.ratingService.noOfMaterialRating({
      rating: Number(rating),
      material_id: Number(material_id),
    });
  }

  @Get('rating/channel_rating')
  noOfChannelRating(
    @Query('rating') rating: string,
    @Query('channel_id') channel_id: string,
  ) {
    return this.ratingService.noOfChannelRating({
      rating: Number(rating),
      channel_id: Number(channel_id),
    });
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingService.update(+id, updateRatingDto);
  }

  //   @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingService.remove(+id);
  }
}
