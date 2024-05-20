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
import { SearchDto, SearchChannelDto } from './dto';
import { SearchUserDto } from './dto/searchUser.dto';

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
  suggestChannel(@Body() searchChannelDto: SearchChannelDto) {
    return this.searchService.suggestChannel(searchChannelDto);
  }
  @Post('/user')
  @HttpCode(HttpStatus.OK)
  suggestUser(@Body() searchUserDto: SearchUserDto) {
    return this.searchService.suggestUser(searchUserDto);
  }
}
