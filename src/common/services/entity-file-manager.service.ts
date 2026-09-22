import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import {
  FileStorageService,
  NamedFileRecord,
  UploadedImages,
} from './file-storage.service';
import { NotFoundError } from '../exceptions/domain-exceptions';

/**
 * Minimal structural shape for a parent entity record as used internally by
 * EntityFileManagerService. Fields are accessed via bracket notation, so the
 * concrete type only needs to satisfy the structural minimum needed by
 * FileStorageService helpers. All Prisma-generated model records satisfy this.
 */
export interface ParentRecord {
  id: number;
  material?: string | null;
  [key: string]: unknown;
}

/**
 * A minimal structural type that captures the operations EntityFileManagerService
 * actually performs on a "parent" entity delegate (Material or ChannelMaterial).
 *
 * Prisma.MaterialDelegate and Prisma.ChannelMaterialDelegate are both structurally
 * compatible with this interface — all their generated methods accept the same
 * arg shapes and return at least this much. Using this instead of `any` gives
 * compile-time safety at every call site without hard-coding a single concrete model.
 */
export interface ParentDelegateSlim {
  findFirst(args?: {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
  }): Promise<ParentRecord | null>;
  findUnique?: (args: {
    where: Record<string, unknown>;
  }) => Promise<ParentRecord | null>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<ParentRecord>;
}

/**
 * A minimal structural type covering the operations performed on image delegates
 * (MaterialImage, ChannelMaterialImage). findFirst returns a NamedFileRecord so
 * that it is directly passable to FileStorageService.updateRelatedFileRecord
 * and uploadRelatedFileRecord without casting.
 */
export interface ImageDelegateSlim {
  findFirst(args?: {
    where?: Record<string, unknown>;
  }): Promise<NamedFileRecord | null>;
  create(args: { data: Record<string, unknown> }): Promise<NamedFileRecord>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<NamedFileRecord>;
}

/**
 * A minimal structural type covering the operations performed on preview delegates
 * (PreviewMaterial, ChannelPreviewMaterial). findFirst returns a NamedFileRecord so
 * it is directly passable to FileStorageService helpers without casting.
 */
export interface PreviewDelegateSlim {
  findFirst(args?: {
    where?: Record<string, unknown>;
  }): Promise<NamedFileRecord | null>;
  findUnique?: (args: {
    where: Record<string, unknown>;
  }) => Promise<NamedFileRecord | null>;
  create(args: { data: Record<string, unknown> }): Promise<NamedFileRecord>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<NamedFileRecord>;
}

/**
 * Configuration bag passed to EntityFileManagerService. Delegates are typed with
 * structurally-minimal interfaces that every Prisma-generated delegate satisfies,
 * eliminating the previous `any`-typed signatures while keeping the service fully
 * generic. Concrete callers (MaterialStorageService, ChannelMaterialStorageService)
 * assign prisma.material / prisma.channelMaterial directly — the Prisma-generated
 * delegates are structurally compatible with these slim interfaces at every call site.
 *
 * Note: Prisma.MaterialDelegate is referenced in the JSDoc below to make the
 * relationship explicit for documentation, but the config itself uses structural
 * (duck-typed) interfaces for genericity.
 *
 * @see Prisma.MaterialDelegate
 * @see Prisma.ChannelMaterialDelegate
 */
export interface EntityFileManagerConfig {
  subDirectory: string;
  foreignKey: string;
  entityName?: string;
  notFoundErrorCode?: string;
  includeRelations?: Record<string, boolean>;
  /**
   * Delegate for the root entity (e.g. prisma.material, prisma.channelMaterial).
   * Structurally satisfies Prisma.MaterialDelegate | Prisma.ChannelMaterialDelegate.
   */
  parentDelegate: ParentDelegateSlim;
  /**
   * Delegate for the associated image entity (e.g. prisma.materialImage, prisma.channelMaterialImage).
   * Structurally satisfies Prisma.MaterialImageDelegate | Prisma.ChannelMaterialImageDelegate.
   */
  imageDelegate: ImageDelegateSlim;
  /**
   * Delegate for the associated preview entity (e.g. prisma.previewMaterial, prisma.channelPreviewMaterial).
   * Structurally satisfies Prisma.PreviewMaterialDelegate | Prisma.ChannelPreviewMaterialDelegate.
   */
  previewDelegate: PreviewDelegateSlim;
}

// Re-export Prisma namespace so callers can verify delegate compatibility via `Prisma.MaterialDelegate`.
export { Prisma };

@Injectable()
export class EntityFileManagerService {
  private readonly logger = new Logger(EntityFileManagerService.name);

  constructor(private readonly fileStorage: FileStorageService) {}

  /**
   * Generic handler to update a single image or preview field on a parent entity.
   * Cleans up the previous file on disk and updates the relational record.
   * @param config Delegate and path configuration for the entity type
   * @param id Identifier of the parent entity
   * @param files Uploaded files map from Multer
   * @param field Target field name ('profile', 'cover', or 'preview')
   * @returns Updated entity or confirmation message
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
   * @param config Delegate and path configuration for the entity type
   * @param file Single uploaded Multer file
   * @param id Identifier of the parent entity
   * @param field Target field name ('profile', 'cover', or 'preview')
   * @returns Success response object
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
   * Handles main material, profile image, cover image, preview file, and gallery image creation.
   * @param config Delegate and path configuration for the entity type
   * @param images Map of uploaded Multer files
   * @param id Identifier of the parent entity
   * @returns Updated parent entity record
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
   * @param config Delegate and path configuration for the entity type
   * @param materialFile Map of uploaded Multer files containing 'material'
   * @param id Identifier of the parent entity
   * @returns Confirmation message object
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
   * @param config Delegate and path configuration for the entity type
   * @param file Single uploaded Multer file
   * @param id Identifier of the parent entity
   * @returns Updated entity record
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
   * Updates or creates secondary non-primary, non-cover gallery images for an entity.
   * Cleans up the previous file on disk if an existing gallery record is updated.
   * @param config Delegate and path configuration for the entity type
   * @param materialImages Uploaded files map containing images
   * @param id Identifier of the parent entity
   * @returns Confirmation message object
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
   * @param config Delegate and path configuration for the entity type
   * @param files Array of uploaded Multer file objects
   * @param id Identifier of the parent entity
   * @returns Array of newly created image records
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
   * @param config Delegate and path configuration for the entity type
   * @param id Identifier of the parent entity
   * @param res Express HTTP response object
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
      parent?.material ?? undefined,
      'Material not found',
    );
  }

  /**
   * Streams the primary profile image to the client response.
   * @param config Delegate and path configuration for the entity type
   * @param id Identifier of the parent entity
   * @param res Express HTTP response object
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
   * @param config Delegate and path configuration for the entity type
   * @param id Identifier of the parent entity
   * @param res Express HTTP response object
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
   * @param config Delegate and path configuration for the entity type
   * @param id Identifier of the image entity record
   * @param res Express HTTP response object
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
   * @param config Delegate and path configuration for the entity type
   * @param id Identifier of the preview entity record
   * @param res Express HTTP response object
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
      preview?.preview ?? undefined,
      'Material preview not found',
    );
  }
}
