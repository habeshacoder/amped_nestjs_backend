// /* eslint-disable prettier/prettier */
// import { Body, Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
// import { User } from '@prisma/client';
// import { GetUser } from 'src/auth/decorator';
// import { JwtGuard } from 'src/auth/guard';
// import { ChannelPurchaseService } from './channel-purchase.service';
// import { Channel_PurchaseDto } from './dto';
// import { ChapaWebHookChannel } from './webhook.channel';

// @UseGuards(JwtGuard)
// @Controller('channel-purchase')
// export class ChannelPurchaseController {
//     constructor(private readonly channelPurchaseService: ChannelPurchaseService) {}

//     @Post('/request_checkout')
//     requestCheckout(@Body() dto: Channel_PurchaseDto, @GetUser() user: User) {
//         return this.channelPurchaseService.checkout(dto, user);
//     }

//     @Get('/verify/:tx_ref')
//     callback(@Param('tx_ref') tx_ref: string, @GetUser() user: User) {
//         return this.channelPurchaseService.verify(tx_ref, user);
//     }

// }
