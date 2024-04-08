/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanDto, UpdateDto } from './dto';
import { JwtGuard } from 'src/auth/guard';


@Controller('subscription-plan')
export class SubscriptionPlanController {
    constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

    @UseGuards(JwtGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() subscriptionPlanDto: SubscriptionPlanDto) {
        return this.subscriptionPlanService.create(subscriptionPlanDto);
    }

    @Get()
    findAll() {
        return this.subscriptionPlanService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subscriptionPlanService.findOne(+id);
    }

    @Get('/getmaterials/:id')
    getMaterialsInSubPlan(@Param('id') id: string) {
        return this.subscriptionPlanService.getMaterialsInSubPlan(+id);
    }

    @Get('/channel/:id')
    findForChannel(@Param('id') id: string) {
        return this.subscriptionPlanService.findForChannel(+id);
    }

    @Get('/seller/:id')
    findForSeller(@Param('id') id: string) {
        return this.subscriptionPlanService.findForSeller(+id);
    }

    @UseGuards(JwtGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() subscriptionPlanDto: UpdateDto) {
        return this.subscriptionPlanService.update(+id, subscriptionPlanDto);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subscriptionPlanService.remove(+id);
    }
    
}
