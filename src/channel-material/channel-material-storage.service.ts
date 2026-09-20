import { ForbiddenException, Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  FileStorageService,
  UploadedImages,
} from '../common/services/file-storage.service';

@Injectable()
export class ChannelMaterialStorageService {
  private readonly logger = new Logger(ChannelMaterialStorageService.name);

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

  private async updateImageField(
    id: number,
    files: UploadedImages,
    field: 'profile' | 'cover' | 'preview',
  ) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: { id },
    });
    if (!material) {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }

    const isProfile = field === 'profile';
    const isCover = field === 'cover';
    const successMsg = `Material ${
      field.charAt(0).toUpperCase() + field.slice(1)
    } Updated Successfully`;

    try {
      if (field === 'preview') {
        return await this.fileStorage.updateRelatedFileRecord(
          files,
          'preview',
          successMsg,
          'channel',
          () =>
            this.prisma.channelPreviewMaterial.findFirst({
              where: { channel_material_id: id },
            }),
          (preview) =>
            this.prisma.channelPreviewMaterial.create({
              data: { preview, channel_material_id: id },
            }),
          (recId, preview) =>
            this.prisma.channelPreviewMaterial.update({
              where: { id: recId },
              data: { preview },
            }),
        );
      }

      return await this.fileStorage.updateRelatedFileRecord(
        files,
        field,
        successMsg,
        'channel',
        () =>
          this.prisma.channelMaterialImage.findFirst({
            where: {
              channel_material_id: id,
              ...(isProfile ? { primary: true } : { cover: true }),
            },
          }),
        (image) =>
          this.prisma.channelMaterialImage.create({
            data: {
              image,
              primary: isProfile,
              cover: isCover,
              channel_material_id: id,
            },
          }),
        (recId, image) =>
          this.prisma.channelMaterialImage.update({
            where: { id: recId },
            data: { image },
          }),
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async uploadImageField(
    file: Express.Multer.File,
    id: number,
    field: 'profile' | 'cover' | 'preview',
  ) {
    const isProfile = field === 'profile';
    const isCover = field === 'cover';

    try {
      if (field === 'preview') {
        return await this.fileStorage.uploadRelatedFileRecord(
          file,
          'channel',
          () =>
            this.prisma.channelPreviewMaterial.findFirst({
              where: { channel_material_id: id },
            }),
          (preview) =>
            this.prisma.channelPreviewMaterial.create({
              data: { preview, channel_material_id: id },
            }),
          (recId, preview) =>
            this.prisma.channelPreviewMaterial.update({
              where: { id: recId },
              data: { preview },
            }),
        );
      }

      return await this.fileStorage.uploadRelatedFileRecord(
        file,
        'channel',
        () =>
          this.prisma.channelMaterialImage.findFirst({
            where: {
              channel_material_id: id,
              ...(isProfile ? { primary: true } : { cover: true }),
            },
          }),
        (image) =>
          this.prisma.channelMaterialImage.create({
            data: {
              image,
              primary: isProfile,
              cover: isCover,
              channel_material_id: id,
            },
          }),
        (recId, image) =>
          this.prisma.channelMaterialImage.update({
            where: { id: recId },
            data: { image },
          }),
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async createFile(images: UploadedImages, id: number) {
    this.logger.debug('createFile images received');
    const extracted = this.fileStorage.extractEntityFileNames(images);

    const material = await this.prisma.channelMaterial.findFirst({
      where: { id },
      include: {
        channel_material_image: true,
        channel_material_preview: true,
      },
    });

    if (!material) {
      throw new ForbiddenException(
        'The material not found. Please check your inputs.',
      );
    }

    try {
      if (extracted.material) {
        await this.prisma.channelMaterial.update({
          where: { id },
          data: { material: extracted.material },
        });
      }

      if (extracted.profile) {
        await this.prisma.channelMaterialImage.create({
          data: {
            image: extracted.profile,
            primary: true,
            channel_material_id: material.id,
          },
        });
      }

      if (extracted.cover) {
        await this.prisma.channelMaterialImage.create({
          data: {
            image: extracted.cover,
            cover: true,
            channel_material_id: material.id,
          },
        });
      }

      if (extracted.preview) {
        await this.prisma.channelPreviewMaterial.create({
          data: {
            preview: extracted.preview,
            channel_material_id: material.id,
          },
        });
      }

      if (extracted.image) {
        await this.prisma.channelMaterialImage.create({
          data: {
            image: extracted.image,
            channel_material_id: material.id,
          },
        });
      }

      return material;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterial(materialFile: UploadedImages, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: { id },
    });
    if (!material) {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      materialFile,
      'material',
    );
    if (!fileName) {
      return { message: 'Material Updated Successfully' };
    }

    try {
      const oldMaterial = material.material;
      await this.prisma.channelMaterial.update({
        where: { id: material.id },
        data: { material: fileName },
      });

      await this.fileStorage.deleteFile('channel', oldMaterial);
      return { message: 'Material Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterialProfile(materialProfile: UploadedImages, id: number) {
    return this.updateImageField(id, materialProfile, 'profile');
  }

  async updateMaterialCover(materialCover: UploadedImages, id: number) {
    return this.updateImageField(id, materialCover, 'cover');
  }

  async updateMaterialPreview(materialPreview: UploadedImages, id: number) {
    return this.updateImageField(id, materialPreview, 'preview');
  }

  async updateMaterialImage(materialImages: UploadedImages, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: { id },
    });
    if (!material) {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }

    const fileName =
      this.fileStorage.extractFieldFileName(materialImages, 'images') ||
      this.fileStorage.extractFieldFileName(materialImages, 'image');

    if (!fileName) {
      return { message: 'Material Image Updated Successfully' };
    }

    const matImg = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: material.id,
        primary: false,
        cover: false,
      },
    });

    try {
      if (matImg) {
        await this.prisma.channelMaterialImage.update({
          where: { id: matImg.id },
          data: { image: fileName },
        });
        await this.fileStorage.deleteFile('channel', matImg.image);
      } else {
        await this.prisma.channelMaterialImage.create({
          data: {
            image: fileName,
            channel_material_id: material.id,
          },
        });
      }
      return { message: 'Material Image Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadMaterial(file: Express.Multer.File, id: number) {
    const material = await this.prisma.channelMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new ForbiddenException('Please register the title first.');
    }

    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    try {
      const updated = await this.prisma.channelMaterial.update({
        where: { id },
        data: { material: fileName },
      });

      if (material.material && material.material !== 'null') {
        await this.fileStorage.deleteFile('channel', material.material);
      }

      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async showMaterial(id: number, @Res() res: Response) {
    const material = await this.prisma.channelMaterial.findUnique({
      where: { id },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      'channel',
      material?.material,
      'Material not found',
    );
  }

  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    return this.uploadImageField(file, id, 'profile');
  }

  async showMaterialProfile(id: number, @Res() res: Response) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: { channel_material_id: id, primary: true },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      'channel',
      materialImage?.image,
      'Material profile not found',
    );
  }

  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    return this.uploadImageField(file, id, 'cover');
  }

  async showMaterialCover(id: number, @Res() res: Response) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: { channel_material_id: id, cover: true },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      'channel',
      materialImage?.image,
      'Material cover not found',
    );
  }

  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    const uploadedImages = [];
    for (const file of files) {
      const fileName = this.fileStorage.extractFileName(
        file?.filename || file?.path,
      );
      try {
        const newMaterialImage = await this.prisma.channelMaterialImage.create({
          data: {
            image: fileName,
            channel_material_id: id,
          },
        });
        if (newMaterialImage) {
          uploadedImages.push(newMaterialImage);
        }
      } catch (error) {
        this.handlePrismaError(error);
      }
    }
    return uploadedImages;
  }

  async showMaterialImage(id: number, @Res() res: Response) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: { id },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      'channel',
      materialImage?.image,
      'Material image not found',
    );
  }

  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    return this.uploadImageField(file, id, 'preview');
  }

  async showMaterialPreview(id: number, @Res() res: Response) {
    const preview = await this.prisma.channelPreviewMaterial.findUnique({
      where: { id },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      'channel',
      preview?.preview,
      'Material preview not found',
    );
  }
}
