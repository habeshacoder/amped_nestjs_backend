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
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { ReplayService } from './replay.service';
import { ReplayDto } from './dto/replay.dto';
import { UpdateReplayDto } from './dto/update-replay.dto';

@Controller('replays')
export class ReplayController {
  constructor(private replayService: ReplayService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() replayDto: ReplayDto) {
    return this.replayService.create(replayDto);
  }

  @Get()
  findAll() {
    return this.replayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.replayService.findOne(+id);
  }

  @Get('check_replay/:remark_id')
  checkReplayByRemarkId(@Param('remark_id') remark_id: string) {
    return this.replayService.findByRemarkId(+remark_id);
  }

  @Get('remark/:remark_id')
  findByRemarkId(@Param('remark_id') remark_id: string) {
    return this.replayService.findByRemarkId(+remark_id);
  }

  @Get('replay_for_remark/:remark_id')
  replayForRemark(@Param('remark_id') remark_id: string) {
    return this.replayService.replayForRemark(+remark_id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReplayDto: UpdateReplayDto) {
    return this.replayService.update(+id, updateReplayDto);
  }

  //   @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.replayService.remove(+id);
  }
}
