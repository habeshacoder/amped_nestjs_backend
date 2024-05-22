import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { SearchService } from './search.service';
import { SearchDto } from './dto';

// @UseGuards(JwtGuard)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  suggest(@Body() searchDto: SearchDto) {
    return this.searchService.suggest(searchDto);
  }

  @Post('/channel')
  @HttpCode(HttpStatus.OK)
  suggestChannel(@Body() searchChannelDto: SearchDto) {
    return this.searchService.suggestChannel(searchChannelDto);
  }
  @Post('/user')
  @HttpCode(HttpStatus.OK)
  suggestUser(@Body() searchUserDto: SearchDto) {
    return this.searchService.suggestUser(searchUserDto);
  }

  @Post('/sellerProfile')
  @HttpCode(HttpStatus.OK)
  suggestSellerProfile(@Body() searchUserDto: SearchDto) {
    return this.searchService.suggestSellerProfile(searchUserDto);
  }

  @Post('/profile')
  @HttpCode(HttpStatus.OK)
  suggestProfile(@Body() searchUserDto: SearchDto) {
    return this.searchService.suggestProfile(searchUserDto);
  }
  @Post('/channel-material')
  @HttpCode(HttpStatus.OK)
  suggestChanneMaterial(@Body() searchUserDto: SearchDto) {
    return this.searchService.suggestChannelMaterial(searchUserDto);
  }
  @Post('/subscription-plan')
  @HttpCode(HttpStatus.OK)
  suggestSubscriptionPlan(@Body() searchUserDto: SearchDto) {
    return this.searchService.suggestSubscriptionPlan(searchUserDto);
  }
}
