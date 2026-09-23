import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  FileStorageService,
  NamedFileRecord,
  UploadedImages,
} from './file-storage.service';
import { NotFoundError } from '../exceptions/domain-exceptions';
import {
  EntityFileManagerConfig,
  ImageDelegateSlim,
  ParentDelegateSlim,
  ParentRecord,
  PreviewDelegateSlim,
  Prisma,
} from './entity-file-manager.types';

export * from './entity-file-manager.types';

@Injectable()
export class EntityFileManagerService {
  private readonly logger = new Logger(EntityFileManagerService.name);

  constructor(private readonly fileStorage: FileStorageService) {}

  private async findParent(config: EntityFileManagerConfig, id: number) {
    return config.parentDelegate.findUnique
      ? await config.parentDelegate.findUnique({ where: { id } })
      : await config.parentDelegate.findFirst({ where: { id } });
  }

  private getPreviewHandlers(config: EntityFileManagerConfig, id: number) {
    return {
      getter: () =>
        config.previewDelegate.findFirst({
          where: { [config.foreignKey]: id },
        }),
      creator: (preview: string) =>
        config.previewDelegate.create({
          data: { preview, [config.foreignKey]: id },
        }),
      updater: (recId: number, preview: string) =>
        config.previewDelegate.update({
          where: { id: recId },
          data: { preview },
        }),
    };
  }

  private getImageHandlers(
    config: EntityFileManagerConfig,
    id: number,
    isProfile: boolean,
    isCover: boolean,
  ) {
    return {
      getter: () =>
        config.imageDelegate.findFirst({
          where: {
            [config.foreignKey]: id,
            ...(isProfile ? { primary: true } : { cover: true }),
          },
        }),
      creator: (image: string) =>
        config.imageDelegate.create({
          data: {
            image,
            primary: isProfile,
            cover: isCover,
            [config.foreignKey]: id,
          },
        }),
      updater: (recId: number, image: string) =>
        config.imageDelegate.update({
          where: { id: recId },
          data: { image },
        }),
    };
  }

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
      const handlers = this.getPreviewHandlers(config, id);
      return await this.fileStorage.updateRelatedFileRecord(
        files,
        'preview',
        successMsg,
        config.subDirectory,
        handlers.getter,
        handlers.creator,
        handlers.updater,
      );
    }

    const handlers = this.getImageHandlers(config, id, isProfile, isCover);
    return await this.fileStorage.updateRelatedFileRecord(
      files,
      field,
      successMsg,
      config.subDirectory,
      handlers.getter,
      handlers.creator,
      handlers.updater,
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
      const handlers = this.getPreviewHandlers(config, id);
      return await this.fileStorage.uploadRelatedFileRecord(
        file,
        config.subDirectory,
        handlers.getter,
        handlers.creator,
        handlers.updater,
      );
    }

    const handlers = this.getImageHandlers(config, id, isProfile, isCover);
    return await this.fileStorage.uploadRelatedFileRecord(
      file,
      config.subDirectory,
      handlers.getter,
      handlers.creator,
      handlers.updater,
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
   * Updates the primary content material file and deletes the previously stored file from disk.
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

    await this.fileStorage.deleteFile(
      config.subDirectory,
      oldMaterial ?? undefined,
    );
    return { message: successMsg };
  }

  /**
   * Uploads primary content material file from a single file field and deletes the old one.
   */
  async uploadMainFile(
    config: EntityFileManagerConfig,
    file: Express.Multer.File,
    id: number,
  ) {
    const parent = await this.findParent(config, id);

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
   * Updates or creates secondary non-primary, non-cover gallery images for an entity.
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
      await this.fileStorage.deleteFile(
        config.subDirectory,
        existing.image ?? undefined,
      );
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
   * Uploads multiple additional images and attaches them to the parent entity.
   */
  async uploadMultipleImages(
    config: EntityFileManagerConfig,
    files: Array<Express.Multer.File>,
    id: number,
  ) {
    const uploadedImages: NamedFileRecord[] = [];
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
   * Streams the main content file directly to the client response.
   */
  async showMainFile(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const parent = await this.findParent(config, id);

    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      parent?.material ?? undefined,
      'Material not found',
    );
  }

  /**
   * Streams the primary profile image to the client response.
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
      image?.image ?? undefined,
      'Material profile not found',
    );
  }

  /**
   * Streams the cover image to the client response.
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
      image?.image ?? undefined,
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
      image?.image ?? undefined,
      'Material image not found',
    );
  }

  /**
   * Streams a preview file by preview record ID.
   */
  async showPreviewById(
    config: EntityFileManagerConfig,
    id: number,
    res: Response,
  ) {
    const preview = config.previewDelegate.findUnique
      ? await config.previewDelegate.findUnique({ where: { id } })
      : await config.previewDelegate.findFirst({ where: { id } });

    return this.fileStorage.sendUploadedFile(
      res,
      config.subDirectory,
      preview?.preview ?? undefined,
      'Material preview not found',
    );
  }
}
