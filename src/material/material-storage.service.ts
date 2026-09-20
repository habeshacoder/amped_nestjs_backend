import { ForbiddenException, Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  FileStorageService,
  UploadedImages,
} from '../common/services/file-storage.service';

@Injectable()
export class MaterialStorageService {
  private readonly logger = new Logger(MaterialStorageService.name);

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

  async createFile(images: UploadedImages, id: number) {
    this.logger.debug('createFile images received');
    const extracted = this.fileStorage.extractEntityFileNames(images);

    const material = await this.prisma.material.findFirst({
      where: { id },
      include: {
        material_image: true,
        material_preview: true,
      },
    });

    if (!material) {
      throw new ForbiddenException(
        'The material not found. Please check your inputs.',
      );
    }

    try {
      if (extracted.material) {
        await this.prisma.material.update({
          where: { id },
          data: { material: extracted.material },
        });
      }

      if (extracted.profile) {
        await this.prisma.materialImage.create({
          data: {
            image: extracted.profile,
            primary: true,
            material_id: material.id,
          },
        });
      }

      if (extracted.cover) {
        await this.prisma.materialImage.create({
          data: {
            image: extracted.cover,
            cover: true,
            material_id: material.id,
          },
        });
      }

      if (extracted.preview) {
        await this.prisma.previewMaterial.create({
          data: {
            preview: extracted.preview,
            material_id: material.id,
          },
        });
      }

      if (extracted.image) {
        await this.prisma.materialImage.create({
          data: {
            image: extracted.image,
            material_id: material.id,
          },
        });
      }

      return material;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterial(materialFile: UploadedImages, id: number) {
    const material = await this.prisma.material.findFirst({ where: { id } });
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
      await this.prisma.material.update({
        where: { id: material.id },
        data: { material: fileName },
      });

      await this.fileStorage.deleteFile('material', oldMaterial);
      return { message: 'Material Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterialProfile(materialProfile: UploadedImages, id: number) {
    const material = await this.prisma.material.findFirst({ where: { id } });
    if (!material) {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      materialProfile,
      'profile',
    );
    if (!fileName) {
      return { message: 'Material Profile Updated Successfully' };
    }

    const matImg = await this.prisma.materialImage.findFirst({
      where: { material_id: material.id, primary: true },
    });

    try {
      if (matImg) {
        await this.prisma.materialImage.update({
          where: { id: matImg.id },
          data: { image: fileName },
        });
        await this.fileStorage.deleteFile('material', matImg.image);
      } else {
        await this.prisma.materialImage.create({
          data: {
            image: fileName,
            primary: true,
            material_id: material.id,
          },
        });
      }
      return { message: 'Material Profile Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterialCover(materialCover: UploadedImages, id: number) {
    const material = await this.prisma.material.findFirst({ where: { id } });
    if (!material) {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      materialCover,
      'cover',
    );
    if (!fileName) {
      return { message: 'Material Cover Updated Successfully' };
    }

    const matImg = await this.prisma.materialImage.findFirst({
      where: { material_id: material.id, cover: true },
    });

    try {
      if (matImg) {
        await this.prisma.materialImage.update({
          where: { id: matImg.id },
          data: { image: fileName },
        });
        await this.fileStorage.deleteFile('material', matImg.image);
      } else {
        await this.prisma.materialImage.create({
          data: {
            image: fileName,
            cover: true,
            material_id: material.id,
          },
        });
      }
      return { message: 'Material Cover Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterialPreview(materialPreview: UploadedImages, id: number) {
    const material = await this.prisma.material.findFirst({ where: { id } });
    if (!material) {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      materialPreview,
      'preview',
    );
    if (!fileName) {
      return { message: 'Material Preview Updated Successfully' };
    }

    const preview = await this.prisma.previewMaterial.findFirst({
      where: { material_id: material.id },
    });

    try {
      if (preview) {
        await this.prisma.previewMaterial.update({
          where: { id: preview.id },
          data: { preview: fileName },
        });
        await this.fileStorage.deleteFile('material', preview.preview);
      } else {
        await this.prisma.previewMaterial.create({
          data: {
            preview: fileName,
            material_id: material.id,
          },
        });
      }
      return { message: 'Material Preview Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateMaterialImage(materialImages: UploadedImages, id: number) {
    const material = await this.prisma.material.findFirst({ where: { id } });
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

    const matImg = await this.prisma.materialImage.findFirst({
      where: {
        material_id: material.id,
        primary: false,
        cover: false,
      },
    });

    try {
      if (matImg) {
        await this.prisma.materialImage.update({
          where: { id: matImg.id },
          data: { image: fileName },
        });
        await this.fileStorage.deleteFile('material', matImg.image);
      } else {
        await this.prisma.materialImage.create({
          data: {
            image: fileName,
            material_id: material.id,
          },
        });
      }
      return { message: 'Material Image Updated Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadMaterial(file: Express.Multer.File, id: number) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new ForbiddenException('Please register the title first.');
    }

    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    try {
      const updated = await this.prisma.material.update({
        where: { id },
        data: { material: fileName },
      });

      if (material.material && material.material !== 'null') {
        await this.fileStorage.deleteFile('material', material.material);
      }

      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async showMaterial(id: number, @Res() res: Response) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material || !material.material) {
      throw new ForbiddenException('Material not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/material', material.material),
    );
  }

  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const existingImage = await this.prisma.materialImage.findFirst({
      where: { material_id: id, primary: true },
    });

    try {
      if (!existingImage) {
        return await this.prisma.materialImage.create({
          data: {
            image: fileName,
            primary: true,
            material_id: id,
          },
        });
      }

      const updated = await this.prisma.materialImage.update({
        where: { id: existingImage.id },
        data: { image: fileName },
      });

      await this.fileStorage.deleteFile('material', existingImage.image);
      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async showMaterialProfile(id: number, @Res() res: Response) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: { material_id: id, primary: true },
    });
    if (!materialImage) {
      throw new ForbiddenException('Material profile not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/material', materialImage.image),
    );
  }

  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const existingCover = await this.prisma.materialImage.findFirst({
      where: { material_id: id, cover: true },
    });

    try {
      if (!existingCover) {
        return await this.prisma.materialImage.create({
          data: {
            image: fileName,
            cover: true,
            material_id: id,
          },
        });
      }

      const updated = await this.prisma.materialImage.update({
        where: { id: existingCover.id },
        data: { image: fileName },
      });

      await this.fileStorage.deleteFile('material', existingCover.image);
      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async showMaterialCover(id: number, @Res() res: Response) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: { material_id: id, cover: true },
    });
    if (!materialImage) {
      throw new ForbiddenException('Material cover not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/material', materialImage.image),
    );
  }

  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    const uploadedImages = [];
    for (const file of files) {
      const fileName = this.fileStorage.extractFileName(
        file?.filename || file?.path,
      );
      try {
        const newMaterialImage = await this.prisma.materialImage.create({
          data: {
            image: fileName,
            material_id: id,
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
    const materialImage = await this.prisma.materialImage.findFirst({
      where: { id },
    });
    if (!materialImage) {
      throw new ForbiddenException('Material image not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/material', materialImage.image),
    );
  }

  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const preview = await this.prisma.previewMaterial.findFirst({
      where: { material_id: id },
    });

    try {
      if (!preview) {
        return await this.prisma.previewMaterial.create({
          data: {
            material_id: id,
            preview: fileName,
          },
        });
      }

      const updated = await this.prisma.previewMaterial.update({
        where: { id: preview.id },
        data: { preview: fileName },
      });

      if (preview.preview && preview.preview !== 'null') {
        await this.fileStorage.deleteFile('material', preview.preview);
      }

      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async showMaterialPreview(id: number, @Res() res: Response) {
    const preview = await this.prisma.previewMaterial.findUnique({
      where: { id },
    });
    if (!preview) {
      throw new ForbiddenException('Material preview not found');
    }

    return res.sendFile(
      join(process.cwd(), 'uploads/material', preview.preview),
    );
  }
}
