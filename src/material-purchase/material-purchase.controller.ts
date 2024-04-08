// /* eslint-disable prettier/prettier */
// import { Body, Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
// import { User } from '@prisma/client';
// import { GetUser } from 'src/auth/decorator';
// import { JwtGuard } from 'src/auth/guard';
// // import { MaterialPurchaseService } from './material-purchase.service';
// import { Material_PurchaseDto } from './dto';
// import { ChapaWebHook } from './webhook.material';

// @UseGuards(JwtGuard)
// @Controller('material-purchase')
// export class MaterialPurchaseController {
//   constructor(
//     private readonly materialPurchaseService: MaterialPurchaseService,
//   ) {}

//   @Post('/request_checkout')
//   requestCheckout(@Body() dto: Material_PurchaseDto, @GetUser() user: User) {
//     dto.material = dto.material.map((i) => Number(i));
//     return this.materialPurchaseService.checkout(dto, user);
//   }
//   @Get('/verify/:tx_ref')
//   callback(@Param('tx_ref') tx_ref: string, @GetUser() user: User) {
//     return this.materialPurchaseService.verify(tx_ref, user);
//   }

//   // @Get('/unfinished-orders')
//   // getUnfinishedOrders() {
//   //   return this.materialPurchaseService.getUnfinishedOrders();
//   // }
// }
