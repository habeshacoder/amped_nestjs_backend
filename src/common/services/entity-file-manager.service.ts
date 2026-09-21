import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { FileStorageService, UploadedImages } from './file-storage.service';
import { NotFoundError } from '../exceptions/domain-exceptions';

export interface EntityFileManagerConfig<
  TParent = any,
  TImage = any,
  TPreview = any,
> {
  subDirectory: string;
  foreignKey: string;
  entityName?: string;
  notFoundErrorCode?: string;
  includeRelations?: Record<string, boolean>;
  parentDelegate: {
    findFirst: (args: any) => Promise<TParent | null>;
    findUnique?: (args: any) => Promise<TParent | null>;
    update: (args: any) => Promise<TParent>;
  };
  imageDelegate: {
    findFirst: (args: any) => Promise<TImage | null>;
    create: (args: any) => Promise<TImage>;
    update: (args: any) => Promise<TImage>;
  };
  previewDelegate: {
    findFirst: (args: any) => Promise<TPreview | null>;
    findUnique?: (args: any) => Promise<TPreview | null>;
    create: (args: any) => Promise<TPreview>;
    update: (args: any) => Promise<TPreview>;
  };
}

@Injectable()
export class EntityFileManagerService {
  private readonly logger = new Logger(EntityFileManagerService.name);

  constructor(private readonly fileStorage: FileStorageService) {}

  /**
   * Generic handler to update a single image or preview field on a parent entity.
   */
  async updateImageField(
    config: EntityFileManagerConfig,
    id: number,
    files: UploadedImages,
    field: 'profile' | 'cover' | 'preview',
  ) {
    const parent = await config.parentDelegate.findFirst({ where: { id } });
    if (!parent) {
      throw new NotFoundError(
        "Can't update while there is no material. Please create a material first.",
        config.notFoundErrorCode || 'MATERIAL_NOT_FOUND',
      );
    }

    const isProfile = field === 'profile';
    const isCover = field === 'cover';
    const entityLabel = config.entityName || 'Material';
    const successMsg = `${entityLabel} ${
      field.charAt(0).toUpperCase() + field.slice(1)
    } Updated Successfully`;

    if (field === 'preview') {
      return await this.fileStorage.updateRelatedFileRecord(
        files,
        'preview',
        successMsg,
        config.subDirectory,
        () =>
          config.previewDelegate.findFirst({
            where: { [config.foreignKey]: id },
          }),
        (preview) =>
          config.previewDelegate.create({
            data: { preview, [config.foreignKey]: id },
          }),
        (recId, preview) =>
          config.previewDelegate.update({
            where: { id: recId },
            data: { preview },
          }),
      );
    }

    return await this.fileStorage.updateRelatedFileRecord(
      files,
      field,
      successMsg,
      config.subDirectory,
      () =>
        config.imageDelegate.findFirst({
          where: {
            [config.foreignKey]: id,
            ...(isProfile ? { primary: true } : { cover: true }),
          },
        }),
      (image) =>
        config.imageDelegate.create({
          data: {
            image,
            primary: isProfile,
            cover: isCover,
            [config.foreignKey]: id,
          },
        }),
      (recId, image) =>
        config.imageDelegate.update({
          where: { id: recId },
          data: { image },
        }),
    );
  }

  /**
   * Generic handler to upload a single image or preview file for a parent entity.
   */
  async uploadImageField(
    config: EntityFileManagerConfig,
    file: Express.Multer.File,
    id: number,
    field: 'profile' | 'cover' | 'preview',
  ) {
    const isProfile = field === 'profile';
    const isCover = field === 'cover';

    if (field === 'preview') {
      return await this.fileStorage.uploadRelatedFileRecord(
        file,
        config.subDirectory,
        () =>
          config.previewDelegate.findFirst({
            where: { [config.foreignKey]: id },
          }),
        (preview) =>
          config.previewDelegate.create({
            data: { preview, [config.foreignKey]: id },
          }),
        (recId, preview) =>
          config.previewDelegate.update({
            where: { id: recId },
            data: { preview },
          }),
      );
    }

    return await this.fileStorage.uploadRelatedFileRecord(
      file,
      config.subDirectory,
      () =>
        config.imageDelegate.findFirst({
          where: {
            [config.foreignKey]: id,
            ...(isProfile ? { primary: true } : { cover: true }),
          },
        }),
      (image) =>
        config.imageDelegate.create({
          data: {
            image,
            primary: isProfile,
            cover: isCover,
            [config.foreignKey]: id,
          },
        }),
      (recId, image) =>
        config.imageDelegate.update({
          where: { id: recId },
          data: { image },
        }),
    );
  }

  /**
   * Creates files and child records for an entity when multiple files are uploaded.
   */
  async createFile(
    config: EntityFileManagerConfig,
    images: UploadedImages,
    id: number,
  ) {
    this.logger.debug('createFile images received');
    const extracted = this.fileStorage.extractEntityFileNames(images);

    const parent = await config.parentDelegate.findFirst({
      where: { id },
      ...(config.includeRelations ? { include: config.includeRelations } : {}),
    });

    if (!parent) {
      throw new NotFoundError(
        'The material not found. Please check your inputs.',
        config.notFoundErrorCode || 'MATERIAL_NOT_FOUND',
      );
    }

    if (extracted.material) {
      await config.parentDelegate.update({
        where: { id },
        data: { material: extracted.material },
      });
    }

    if (extracted.profile) {
      await config.imageDelegate.create({
        data: {
          image: extracted.profile,
          primary: true,
          [config.foreignKey]: parent.id,
        },
      });
    }

    if (extracted.cover) {
      await config.imageDelegate.create({
        data: {
          image: extracted.cover,
          cover: true,
          [config.foreignKey]: parent.id,
        },
      });
    }

    if (extracted.preview) {
      await config.previewDelegate.create({
        data: {
          preview: extracted.preview,
          [config.foreignKey]: parent.id,
        },
      });
    }

    if (extracted.image) {
      await config.imageDelegate.create({
        data: {
          image: extracted.image,
          [config.foreignKey]: parent.id,
        },
      });
    }

    return parent;
  }

  /**
   * Updates the primary content material file.
   */
  async updateMainFile(
    config: EntityFileManagerConfig,
    materialFile: UploadedImages,
    id: number,
  ) {
    const parent = await config.parentDelegate.findFirst({ where: { id } });
    if (!parent) {
      throw new NotFoundError(
        "Can't update while there is no material. Please create a material first.",
        config.notFoundErrorCode || 'MATERIAL_NOT_FOUND',
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      materialFile,
      'material',
    );
    const entityLabel = config.entityName || 'Material';
    const successMsg = `${entityLabel} Updated Successfully`;

    if (!fileName) {
      return { message: successMsg };
    }

    const oldMaterial = parent.material;
    await config.parentDelegate.update({
      where: { id: parent.id },
      data: { material: fileName },
    });

    await this.fileStorage.deleteFile(config.subDirectory, oldMaterial);
    return { message: successMsg };
  }

  /**
   * Uploads primary content material file and deletes the old one.
   */
  async uploadMainFile(
    config: EntityFileManagerConfig,
    file: Express.Multer.File,
    id: number,
  ) {
    const findUnique = config.parentDelegate.findUnique;
    const parent = findUnique
      ? await findUnique({ where: { id } })
      : await config.parentDelegate.findFirst({ where: { id } });

    if (!parent) {
      throw new NotFoundError(
        'Please register the title first.',
        config.notFoundErrorCode || 'MATERIAL_NOT_FOUND',
      );
    }

    const fileName = this.fileStorage.extractFileName(
      file?.filename || file?.path,
    );

    const updated = await config.parentDelegate.update({
      where: { id },
      data: { material: fileName },
    });

    if (parent.material && parent.material !== 'null') {
      await this.fileStorage.deleteFile(config.subDirectory, parent.material);
    }

    return updated;
  }

  /**
   * Updates secondary non-primary, non-cover images.
   */
  async updateAdditionalImage(
    config: EntityFileManagerConfig,
    materialImages: UploadedImages,
    id: number,
  ) {
    const parent = await config.parentDelegate.findFirst({ where: { id } });
    if (!parent) {
      throw new NotFoundError(
        "Can't update while there is no material. Please create a material first.",
        config.notFoundErrorCode || 'MATERIAL_NOT_FOUND',
      );
    }

    const fileName =
      this.fileStorage.extractFieldFileName(materialImages, 'images') ||
      this.fileStorage.extractFieldFileName(materialImages, 'image');

    const entityLabel = config.entityName || 'Material';
    const successMsg = `${entityLabel} Image Updated Successfully`;

    if (!fileName) {
      return { message: successMsg };
    }

    const existing = await config.imageDelegate.findFirst({
      where: {
        [config.foreignKey]: parent.id,
        primary: false,
        cover: false,
      },
    });

    if (existing) {
      await config.imageDelegate.update({
        where: { id: existing.id },
        data: { image: fileName },
      });
      await this.fileStorage.deleteFile(config.subDirectory, existing.image);
    } else {
      await config.imageDelegate.create({
        data: {
          image: fileName,
          [config.foreignKey]: parent.id,
        },
      });
    }
    return { message: successMsg };
  }

  /**
   * Uploads multiple additional images.
   */
  async uploadMultipleImages(
    config: EntityFileManagerConfig,
    files: Array<Express.Multer.File>,
    id: number,
  ) {
    const uploadedImages = [];
    for (const file of files) {
      const fileName = this.fileStorage.extractFileName(
        file?.filename || file?.path,
      );
      const newImage = await config.imageDelegate.create({
        data: {
          image: fileName,
          [config.foreignKey]: id,
        },
      });
      if (newImage) {
        uploadedImages.push(newImage);
      }
    }
    return uploadedImages;
  }

  /**
   * Streams the main content file.
   */
  async showMainFile(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const findUnique = config.parentDelegate.findUnique;
    const parent = findUnique
      ? await findUnique({ where: { id } })
      : await config.parentDelegate.findFirst({ where: { id } });

    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      parent?.material,
      'Material not found',
    );
  }

  /**
   * Streams the primary profile image.
   */
  async showProfileImage(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const image = await config.imageDelegate.findFirst({
      where: { [config.foreignKey]: id, primary: true },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      image?.image,
      'Material profile not found',
    );
  }

  /**
   * Streams the cover image.
   */
  async showCoverImage(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const image = await config.imageDelegate.findFirst({
      where: { [config.foreignKey]: id, cover: true },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      image?.image,
      'Material cover not found',
    );
  }

  /**
   * Streams an image by image record ID.
   */
  async showImageById(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const image = await config.imageDelegate.findFirst({
      where: { id },
    });
    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      image?.image,
      'Material image not found',
    );
  }

  /**
   * Streams a preview by preview record ID.
   */
  async showPreviewById(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const findUnique = config.previewDelegate.findUnique;
    const preview = findUnique
      ? await findUnique({ where: { id } })
      : await config.previewDelegate.findFirst({ where: { id } });

    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      preview?.preview,
      'Material preview not found',
    );
  }
}
