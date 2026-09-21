import { Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadedImages } from './file-storage.service';
import {
  ConflictError,
  DomainException,
} from '../exceptions/domain-exceptions';
import {
  EntityFileManagerConfig,
  EntityFileManagerService,
} from './entity-file-manager.service';

/**
 * Base abstract class providing reusable storage operations for material and channel-material entities.
 * Delegates common disk persistence, relational database synchronization, and streaming to EntityFileManagerService.
 */
export abstract class BaseEntityStorageService {
  protected abstract readonly config: EntityFileManagerConfig;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly fileManager: EntityFileManagerService,
  ) {}

  /**
   * Translates Prisma database errors to domain exceptions.
   * @param error The raw error caught from operation
   * @throws ConflictError when a unique constraint violation (P2002) occurs
   */
  protected handlePrismaError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Credentials Taken', 'CREDENTIALS_TAKEN');
    }
    if (error instanceof DomainException) {
      throw error;
    }
    throw error;
  }

  /**
   * Persists all initial files uploaded during entity creation (main file, profile, cover, preview, gallery images).
   * @param images Multer uploaded file map
   * @param id Identifier of the parent entity
   * @returns The updated parent entity with relation references
   */
  async createFile(images: UploadedImages, id: number) {
    try {
      return await this.fileManager.createFile(this.config, images, id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Updates the primary media or document file for an existing entity, removing the replaced file from disk.
   * @param materialFile Multer uploaded file containing the new main file
   * @param id Identifier of the parent entity
   * @returns Success message confirming main file update
   */
  async updateMaterial(materialFile: UploadedImages, id: number) {
    try {
      return await this.fileManager.updateMainFile(
        this.config,
        materialFile,
        id,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Updates the profile/avatar image for an entity, cleaning up the previously stored file.
   * @param materialProfile Multer uploaded file containing the new profile image
   * @param id Identifier of the parent entity
   * @returns Updated parent entity record
   */
  async updateMaterialProfile(materialProfile: UploadedImages, id: number) {
    try {
      return await this.fileManager.updateImageField(
        this.config,
        id,
        materialProfile,
        'profile',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Updates the cover banner image for an entity, cleaning up the previously stored file.
   * @param materialCover Multer uploaded file containing the new cover banner
   * @param id Identifier of the parent entity
   * @returns Updated parent entity record
   */
  async updateMaterialCover(materialCover: UploadedImages, id: number) {
    try {
      return await this.fileManager.updateImageField(
        this.config,
        id,
        materialCover,
        'cover',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Updates the teaser/sample preview file for an entity, replacing existing preview records.
   * @param materialPreview Multer uploaded file containing the new preview file
   * @param id Identifier of the parent entity
   * @returns Updated preview entity record
   */
  async updateMaterialPreview(materialPreview: UploadedImages, id: number) {
    try {
      return await this.fileManager.updateImageField(
        this.config,
        id,
        materialPreview,
        'preview',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Replaces or updates the secondary gallery image collection for an entity.
   * @param materialImages Multer uploaded file containing gallery images
   * @param id Identifier of the parent entity
   * @returns Updated image entity record
   */
  async updateMaterialImage(materialImages: UploadedImages, id: number) {
    try {
      return await this.fileManager.updateAdditionalImage(
        this.config,
        materialImages,
        id,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Uploads a single file to serve as the primary media asset for an entity.
   * @param file Single Multer file object
   * @param id Identifier of the parent entity
   * @returns Success response object
   */
  async uploadMaterial(file: Express.Multer.File, id: number) {
    try {
      return await this.fileManager.uploadMainFile(this.config, file, id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Streams the main content file directly to the client response.
   * @param id Identifier of the parent entity
   * @param res Express HTTP response object
   */
  async showMaterial(id: number, @Res() res: Response) {
    return this.fileManager.showMainFile(this.config, id, res);
  }

  /**
   * Uploads and attaches a single profile/avatar file to the entity.
   * @param file Single Multer file object
   * @param id Identifier of the parent entity
   * @returns Success response object
   */
  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    try {
      return await this.fileManager.uploadImageField(
        this.config,
        file,
        id,
        'profile',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Streams the profile/avatar image to the client response.
   * @param id Identifier of the parent entity
   * @param res Express HTTP response object
   */
  async showMaterialProfile(id: number, @Res() res: Response) {
    return this.fileManager.showProfileImage(this.config, id, res);
  }

  /**
   * Uploads and attaches a single cover banner image file to the entity.
   * @param file Single Multer file object
   * @param id Identifier of the parent entity
   * @returns Success response object
   */
  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    try {
      return await this.fileManager.uploadImageField(
        this.config,
        file,
        id,
        'cover',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Streams the cover banner image to the client response.
   * @param id Identifier of the parent entity
   * @param res Express HTTP response object
   */
  async showMaterialCover(id: number, @Res() res: Response) {
    return this.fileManager.showCoverImage(this.config, id, res);
  }

  /**
   * Uploads multiple gallery image files and associates them with the entity.
   * @param files Array of uploaded Multer file objects
   * @param id Identifier of the parent entity
   * @returns Success response object
   */
  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    try {
      return await this.fileManager.uploadMultipleImages(
        this.config,
        files,
        id,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Streams a gallery image file identified by its image record ID.
   * @param id Identifier of the image entity record
   * @param res Express HTTP response object
   */
  async showMaterialImage(id: number, @Res() res: Response) {
    return this.fileManager.showImageById(this.config, id, res);
  }

  /**
   * Uploads and attaches a single sample preview file to the entity.
   * @param file Single Multer file object
   * @param id Identifier of the parent entity
   * @returns Success response object
   */
  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    try {
      return await this.fileManager.uploadImageField(
        this.config,
        file,
        id,
        'preview',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Streams a sample preview file identified by its preview record ID.
   * @param id Identifier of the preview entity record
   * @param res Express HTTP response object
   */
  async showMaterialPreview(id: number, @Res() res: Response) {
    return this.fileManager.showPreviewById(this.config, id, res);
  }
}
