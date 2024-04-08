/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SubscribedUserService } from "./subscribed-user.service";
import { JwtGuard } from "src/auth/guard";
import { User } from "@prisma/client";
import { GetUser } from "src/auth/decorator";
import { SubscribedUserDto, UpdateSubscribedUserDto } from "./dto";

@UseGuards(JwtGuard)
@Controller('subscribed-users')
export class SebscribedUserController {
    constructor(private readonly subscribedUserService: SubscribedUserService){}

    @Post() 
    @HttpCode(HttpStatus.CREATED)
    create(@Body() subscribedUserDto: SubscribedUserDto, @GetUser() user: User) {
        return this.subscribedUserService.create(subscribedUserDto, user);
    }

    @Get()
    findAll() {
        return this.subscribedUserService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subscribedUserService.findOne(+id);
    } 

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSubscribedUserDto: UpdateSubscribedUserDto) {
        return this.subscribedUserService.update(+id, updateSubscribedUserDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subscribedUserService.remove(+id);
    }
}