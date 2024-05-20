// /* eslint-disable no-var */
// /* eslint-disable prettier/prettier */
// import { Body, ForbiddenException, Injectable } from '@nestjs/common';
// import { User } from '@prisma/client';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { ConfigService } from '@nestjs/config/dist/config.service';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
// import { Channel_PurchaseDto } from './dto';
// import { ChapaService } from 'chapa-nestjs';
// // import { VerifyPayment } from 'verify-payment.chapa';
// var request = require('request');

// @Injectable()
// export class ChannelPurchaseService {
//   private statusTrue: string = '';

//   constructor(
//     private prisma: PrismaService,
//     private chapaService: ChapaService,
//     private config: ConfigService,
//   ) {}

//   async checkout(dto: Channel_PurchaseDto, user: User) {
//     //collect all the materials that are ordered to be purchased
//     //prepare tx_ref that holds all the detail
//     //send the link top the payment

//     //generate tx_ref here
//     const tx_ref = await this.chapaService.generateTransactionReference();
//     const secret = this.config.get('CHAPA_SECRET_KEY');

//     try {
//       const unfinishedOrderChannel =
//         await this.prisma.unfinishedOrderChannel.create({
//           data: {
//             tx_ref: tx_ref,
//             user_id: user.id,
//             price: +dto.price,
//             tax: +dto.tax,
//             total: +dto.total,
//             is_paied: false,
//             subscriptionPlan_id: +dto.plan,
//           },
//         });

//       if (unfinishedOrderChannel) {
//         // console.log(unfinishedOrders);
//         // dto.material.forEach(async (material) => {
//         //     const addedMaterial = await this.prisma.unfinishedOrderDetails.create(
//         //         {
//         //             data: {
//         //                 unfinishedOrder_id: unfinishedOrders.id,
//         //                 material_id: material,
//         //             },
//         //         },
//         //     );

//         //     if (addedMaterial) {
//         //         // do not do anything
//         //     } else {
//         //         //prepare a function to dellet all related unfinished orders with details
//         //     }
//         // });

//         var options = {
//           method: 'POST',
//           url: 'https://api.chapa.co/v1/transaction/initialize',
//           headers: {
//             Authorization: 'Bearer ' + secret,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             amount: dto.total.toString(),
//             currency: dto.currency,
//             email: dto.email,
//             first_name: dto.first_name,
//             last_name: dto.last_name,
//             phone_number: dto.phone_no,
//             tx_ref: tx_ref,
//             callback_url:
//               'https://localhost:3000/channel-purchase/verify/' + tx_ref,
//             return_url: dto.return_url,
//             'customization[title]': 'Payment from AratKillo',
//             'customization[description]':
//               'add the channel name and the plan here.',
//           }),
//         };

//         var re;

//         let myPromise = new Promise(function (resolve, reject) {
//           request(options, function (error, response, body) {
//             if (error) return reject(error);
//             try {
//               resolve(body);
//             } catch (error) {
//               reject(error);
//             }
//           });
//         });

//         await myPromise.then(
//           function (success) {
//             /* code if successful */
//             re = JSON.parse(success as string);
//           },
//           function (error) {
//             /* code if some error */
//             console.error(error);
//           },
//         );
//         return re;
//       }
//     } catch (error) {
//       if (error instanceof PrismaClientKnownRequestError) {
//         if (error.code === 'P2002') {
//           throw new ForbiddenException('Credentials Taken');
//         }
//       }
//       throw new ForbiddenException(
//         'There has been an error. Please check the inputs and try again.',
//       );
//     }
//   }

//   async verify(tx_ref: string, user: User) {
//     //here check is payment is verified
//     //save the data as purchased
//     //return a success message

//     const secret = this.config.get('CHAPA_SECRET_KEY');
//     let res = null;

//     try {
//       const orders = await this.prisma.unfinishedOrderChannel.findUnique({
//         where: {
//           tx_ref: tx_ref,
//         },
//       });

//       if (orders) {
//         // const verifypayment = new VerifyPayment(tx_ref, secret);

//         // console.log(verifypayment.verifyPayment());

//         var options = {
//           method: 'GET',
//           url: 'https://api.chapa.co/v1/transaction/verify/' + tx_ref,
//           headers: {
//             Authorization: 'Bearer ' + secret,
//           },
//         };

//         var re;

//         let myPromise = new Promise(function (resolve, reject) {
//           request(options, function (error, response, body) {
//             if (error) return reject(error);
//             try {
//               resolve(body);
//             } catch (error) {
//               reject(error);
//             }
//           });
//         });

//         var status = 'fail';

//         await myPromise.then(
//           async function (success) {
//             /* code if successful */
//             re = JSON.parse(success as string);
//             status = re.status;
//           },
//           function (error) {
//             /* code if some error */
//             console.error(error);
//           },
//         );

//         if (status == 'success') {
//           // for await (let details of orders.unfinished_order_details) {
//           var car = await this.prisma.subscribedUser.create({
//             data: {
//               user_id: user.id,
//               subscription_id: orders.subscriptionPlan_id,
//             },
//           });

//           var car2 = await this.prisma.unfinishedOrderChannel.update({
//             where: {
//               id: orders.id,
//             },
//             data: {
//               is_paied: true,
//             },
//           });
//           // }

//           //delete from cart table
//         }

//         const channels = await this.prisma.subscribedUser.findMany({
//           where: {
//             user_id: user.id,
//           },
//         });

//         return channels;
//       }
//     } catch (error) {
//       if (error instanceof PrismaClientKnownRequestError) {
//         if (error.code === 'P2002') {
//           throw new ForbiddenException('Credentials Taken');
//         }
//       }
//       console.log(error);
//       throw new ForbiddenException(
//         'There has been an error. Please check the inputs and try again.',
//       );
//     }
//   }

//   // async getMyBody(options, callback) {
//   //     await request(
//   //         options
//   //     , function (error, response, body) {
//   //             if (error || response.statusCode !== 200) {
//   //                 return callback(error || { statusCode: response.statusCode });
//   //             }
//   //             callback(null, JSON.parse(body));
//   //         });
//   //   }
// }
