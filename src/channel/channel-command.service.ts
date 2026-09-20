import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelDto } from './dto';
import {
  FileStorageService,
  UploadedImages,
} from '../common/services/file-storage.service';

@Injectable()
export class ChannelCommandService {
  private readonly logger = new Logger(ChannelCommandService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
  ) {}

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ForbiddenException('Credentials Taken');
    }
    throw new ForbiddenException(
      'There has been an error. Please check the inputs and try again.',
    );
  }

  async create(images: UploadedImages, channelDto: ChannelDto) {
    const profileName = this.fileStorage.extractFieldFileName(
      images,
      'profile',
    );
    const coverName = this.fileStorage.extractFieldFileName(images, 'cover');
    const seller = parseInt(channelDto.sellerProfile_id, 10);

    try {
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
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, channelDto: ChannelDto) {
    const channel = await this.prisma.channel.findFirst({ where: { id } });
    if (!channel) {
      throw new ForbiddenException(
        "Can't update while there is no channel. Please create a channel first.",
      );
    }

    try {
      return await this.prisma.channel.update({
        where: { id },
        data: {
          name: channelDto.name,
          description: channelDto.description,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateChannelProfileImage(
    profileImage: UploadedImages,
    channel_id: number,
  ) {
    const channel = await this.prisma.channel.findFirst({
      where: { id: channel_id },
    });
    if (!channel) {
      throw new ForbiddenException(
        "Can't update while there is no channel. Please create a channel first.",
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      profileImage,
      'profile',
    );
    if (!fileName) {
      return { message: 'Channel Profile Image Uploaded Successfully' };
    }

    const chImage = await this.prisma.channelImage.findFirst({
      where: { channel_id, primary: true },
    });

    try {
      if (chImage) {
        await this.prisma.channelImage.update({
          where: { id: chImage.id },
          data: { image: fileName },
        });
        if (chImage.image && chImage.image !== 'null') {
          await this.fileStorage.deleteFile('channel', chImage.image);
        }
      } else {
        await this.prisma.channelImage.create({
          data: {
            image: fileName,
            primary: true,
            channel_id,
          },
        });
      }

      return { message: 'Channel Profile Image Uploaded Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateChannelCoverImage(
    coverImage: UploadedImages,
    channel_id: number,
  ) {
    const channel = await this.prisma.channel.findFirst({
      where: { id: channel_id },
    });
    if (!channel) {
      throw new ForbiddenException(
        "Can't update while there is no channel. Please create a channel first.",
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(coverImage, 'cover');
    if (!fileName) {
      return { message: 'Channel Cover Image Uploaded Successfully' };
    }

    const chImage = await this.prisma.channelImage.findFirst({
      where: { channel_id, cover: true },
    });

    try {
      if (chImage) {
        await this.prisma.channelImage.update({
          where: { id: chImage.id },
          data: { image: fileName },
        });
        if (chImage.image && chImage.image !== 'null') {
          await this.fileStorage.deleteFile('channel', chImage.image);
        }
      } else {
        await this.prisma.channelImage.create({
          data: {
            image: fileName,
            cover: true,
            channel_id,
          },
        });
      }

      return { message: 'Channel Cover Image Uploaded Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    const channel = await this.prisma.channel.findFirst({
      where: { id },
      include: { channel_image: true, channel_preview: true },
    });

    if (!channel) {
      throw new ForbiddenException(
        "Can't delete while there is no channel. Please create a channel first.",
      );
    }

    try {
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
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadChannelProfile(file: Express.Multer.File, id: number) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const channelImage = await this.prisma.channelImage.findFirst({
      where: { channel_id: id, primary: true },
    });

    try {
      if (!channelImage) {
        return await this.prisma.channelImage.create({
          data: {
            image: fileName,
            primary: true,
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
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadChannelCover(file: Express.Multer.File, id: number) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const channelImage = await this.prisma.channelImage.findFirst({
      where: { channel_id: id, cover: true },
    });

    try {
      if (!channelImage) {
        return await this.prisma.channelImage.create({
          data: {
            image: fileName,
            cover: true,
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
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadChannelImage(files: Array<Express.Multer.File>, id: number) {
    const uploadedImages = [];
    for (const file of files) {
      const fileName = this.fileStorage.extractFileName(
        file?.filename || file?.path,
      );
      try {
        const newChannelImage = await this.prisma.channelImage.create({
          data: {
            image: fileName,
            channel_id: id,
          },
        });
        if (newChannelImage) {
          uploadedImages.push(newChannelImage);
        }
      } catch (error) {
        this.handlePrismaError(error);
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

    try {
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
    } catch (error) {
      this.handlePrismaError(error);
    }
  }
}
