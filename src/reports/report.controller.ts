/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportDto } from './dto';
import { GetUser } from 'src/auth/decorator';
import { ReportType, User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard';

@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() reportDto: ReportDto, @GetUser() user: User) {
    return this.reportService.create(reportDto, user);
  }

  @Get()
  findAll() {
    return this.reportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(+id);
  }

  @Get('report/:report_type')
  findByReportType(@Param('report_type') report_type: ReportType) {
    return this.reportService.findByReportType(report_type);
  }

  @Get('reports_on_material/:material_id')
  reportsOnMaterial(@Param('material_id') material_id: string) {
    return this.reportService.reportsOnMaterial(+material_id);
  }

  @Get('reports_on_channel/:channel_id')
  reportsOnChannel(@Param('channel_id') channel_id: string) {
    return this.reportService.reportsOnChannel(+channel_id);
  }

  //   @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportService.remove(+id);
  }
}
