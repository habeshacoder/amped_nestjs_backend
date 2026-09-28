import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelDto } from './dto';
import {
  FileStorageService,
  UploadedImages,
} from '../common/services/file-storage.service';
import {
  ConflictError,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';
import { EntityFileManagerService } from '../common/services/entity-file-manager.service';
import { withPrismaErrorHandling } from '../common/utils/with-prisma-error.util';

@Injectable()
export class ChannelCommandService {
  private readonly logger = new Logger(ChannelCommandService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
    private readonly fileManager: EntityFileManagerService,
  ) {}

  async create(images: UploadedImages, channelDto: ChannelDto) {
    const profileName = this.fileStorage.extractFieldFileName(
      images,
      'profile',
    );
    const coverName = this.fileStorage.extractFieldFileName(images, 'cover');
    const seller = parseInt(channelDto.sellerProfile_id, 10);

    return await withPrismaErrorHandling(async () => {
      const channel = await this.prisma.channel.create({
        data: {
          name: channelDto.name,
          description: channelDto.description,
          sellerProfile_id: seller,
        },
      });

      if (profileName) {
        await this.prisma.channelImage.create({
          data: {
            image: profileName,
            primary: true,
            channel_id: channel.id,
          },
        });
      }

      if (coverName) {
        await this.prisma.channelImage.create({
          data: {
            image: coverName,
            cover: true,
            channel_id: channel.id,
          },
        });
      }

      return channel;
    });
  }

  async update(id: number, channelDto: ChannelDto) {
    const channel = await this.prisma.channel.findFirst({ where: { id } });
    if (!channel) {
      throw new NotFoundError(
        "Can't update while there is no channel. Please create a channel first.",
        'CHANNEL_NOT_FOUND',
      );
    }

    return await withPrismaErrorHandling(() =>
      this.prisma.channel.update({
        where: { id },
        data: {
          name: channelDto.name,
          description: channelDto.description,
        },
      }),
    );
  }

  async updateChannelProfileImage(
    profileImage: UploadedImages,
    channel_id: number,
  ) {
    return this.fileManager.updateEntityFieldImage(
      this.prisma.channel,
      this.prisma.channelImage,
      channel_id,
      profileImage,
      'profile',
    );
  }

  async updateChannelCoverImage(
    coverImage: UploadedImages,
    channel_id: number,
  ) {
    return this.fileManager.updateEntityFieldImage(
      this.prisma.channel,
      this.prisma.channelImage,
      channel_id,
      coverImage,
      'cover',
    );
  }

  async remove(id: number) {
    const channel = await this.prisma.channel.findFirst({
      where: { id },
      include: { channel_image: true, channel_preview: true },
    });

    if (!channel) {
      throw new NotFoundError(
        "Can't delete while there is no channel. Please create a channel first.",
        'CHANNEL_NOT_FOUND',
      );
    }

    return await withPrismaErrorHandling(async () => {
      const deleted = await this.prisma.channel.delete({ where: { id } });

      for (const img of channel.channel_image) {
        if (img.image && img.image !== 'null') {
          await this.fileStorage.deleteFile('channel', img.image);
        }
      }
      for (const prev of channel.channel_preview) {
        if (prev.preview && prev.preview !== 'null') {
          await this.fileStorage.deleteFile('channel', prev.preview);
        }
      }

      return { message: 'Channel Deleted Successfully' };
    });
  }

  private async uploadSingleChannelImage(
    file: Express.Multer.File,
    id: number,
    field: 'profile' | 'cover',
  ) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );
    const isProfile = field === 'profile';
    const flagKey = isProfile ? 'primary' : 'cover';

    const channelImage = await this.prisma.channelImage.findFirst({
      where: { channel_id: id, [flagKey]: true },
    });

    return await withPrismaErrorHandling(async () => {
      if (!channelImage) {
        return await this.prisma.channelImage.create({
          data: {
            image: fileName,
            [flagKey]: true,
            channel_id: id,
          },
        });
      }

      const updated = await this.prisma.channelImage.update({
        where: { id: channelImage.id },
        data: { image: fileName },
      });

      if (channelImage.image && channelImage.image !== 'null') {
        await this.fileStorage.deleteFile('channel', channelImage.image);
      }

      return updated;
    });
  }

  async uploadChannelProfile(file: Express.Multer.File, id: number) {
    return this.uploadSingleChannelImage(file, id, 'profile');
  }

  async uploadChannelCover(file: Express.Multer.File, id: number) {
    return this.uploadSingleChannelImage(file, id, 'cover');
  }

  async uploadChannelImage(files: Array<Express.Multer.File>, id: number) {
    const uploadedImages = [];
    for (const file of files) {
      const fileName = this.fileStorage.extractFileName(
        file?.filename || file?.path,
      );
      const newChannelImage = await withPrismaErrorHandling(() =>
        this.prisma.channelImage.create({
          data: {
            image: fileName,
            channel_id: id,
          },
        }),
      );
      if (newChannelImage) {
        uploadedImages.push(newChannelImage);
      }
    }
    return uploadedImages;
  }

  async uploadChannelPreview(file: Express.Multer.File, id: number) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const preview = await this.prisma.previewChannel.findFirst({
      where: { channel_id: id },
    });

    return await withPrismaErrorHandling(async () => {
      if (!preview) {
        return await this.prisma.previewChannel.create({
          data: {
            channel_id: id,
            preview: fileName,
          },
        });
      }

      const updated = await this.prisma.previewChannel.update({
        where: { id: preview.id },
        data: { preview: fileName },
      });

      if (preview.preview && preview.preview !== 'null') {
        await this.fileStorage.deleteFile('channel', preview.preview);
      }

      return updated;
    });
  }
}
