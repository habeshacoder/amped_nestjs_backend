import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { JwtGuard } from "src/auth/guard";
import { SearchService } from "./search.service";
import { SearchDto, SearchChannelDto } from "./dto";

@UseGuards(JwtGuard)
@Controller('search')
export class SearchController {
    constructor(private searchService: SearchService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    suggest(@Body() searchDto: SearchDto) {
        return this.searchService.suggest(searchDto);
    }

    @Post("/channel")
    @HttpCode(HttpStatus.OK)
    suggestChannel(@Body() searchChannelDto: SearchChannelDto) {
        return this.searchService.suggestChannel(searchChannelDto);
    }
}