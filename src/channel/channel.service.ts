import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChannelDto } from './dto';
import { ChannelQueryService } from './channel-query.service';
import { ChannelCommandService } from './channel-command.service';
import { UploadedImages } from '../common/services/file-storage.service';

@Injectable()
export class ChannelService {
  constructor(
    private readonly queryService: ChannelQueryService,
    private readonly commandService: ChannelCommandService,
  ) {}

  // Command delegations
  async create(images: UploadedImages, channelDto: ChannelDto) {
    return this.commandService.create(images, channelDto);
  }

  async update(id: number, channelDto: ChannelDto) {
    return this.commandService.update(id, channelDto);
  }

  async updateChannelProfileImage(
    profileImage: UploadedImages,
    channel_id: number,
  ) {
    return this.commandService.updateChannelProfileImage(
      profileImage,
      channel_id,
    );
  }

  async updateChannelCoverImage(
    coverImage: UploadedImages,
    channel_id: number,
  ) {
    return this.commandService.updateChannelCoverImage(coverImage, channel_id);
  }

  async remove(id: number) {
    return this.commandService.remove(id);
  }

  async uploadChannelProfile(file: Express.Multer.File, id: number) {
    return this.commandService.uploadChannelProfile(file, id);
  }

  async uploadChannelCover(file: Express.Multer.File, id: number) {
    return this.commandService.uploadChannelCover(file, id);
  }

  async uploadChannelImage(files: Array<Express.Multer.File>, id: number) {
    return this.commandService.uploadChannelImage(files, id);
  }

  async uploadChannelPreview(file: Express.Multer.File, id: number) {
    return this.commandService.uploadChannelPreview(file, id);
  }

  // Query delegations
  async findAll() {
    return this.queryService.findAll();
  }

  async paginateChannels(params: { take?: number; page?: number }) {
    return this.queryService.paginateChannels(params);
  }

  async findOne(id: number) {
    return this.queryService.findOne(id);
  }

  async getMyChannels(sellerId: number) {
    return this.queryService.getMyChannels(sellerId);
  }

  async newChannels() {
    return this.queryService.newChannels();
  }

  async findForSeller(id: number) {
    return this.queryService.findForSeller(id);
  }

  async findDraftForSeller(id: number) {
    return this.queryService.findDraftForSeller(id);
  }

  async showChannelProfile(channelId: number, @Res() res: Response) {
    return this.queryService.showChannelProfile(channelId, res);
  }

  async showChannelCover(id: number, @Res() res: Response) {
    return this.queryService.showChannelCover(id, res);
  }

  async showChannelImage(id: number, @Res() res: Response) {
    return this.queryService.showChannelImage(id, res);
  }

  async getChannelCoverImageName(channel_id: number) {
    return this.queryService.getChannelCoverImageName(channel_id);
  }

  async showChannelPreview(id: number, @Res() res: Response) {
    return this.queryService.showChannelPreview(id, res);
  }
}
