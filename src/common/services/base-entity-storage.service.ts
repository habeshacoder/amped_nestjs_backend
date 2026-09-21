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

export abstract class BaseEntityStorageService {
  protected abstract readonly config: EntityFileManagerConfig;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly fileManager: EntityFileManagerService,
  ) {}

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

  async createFile(images: UploadedImages, id: number) {
    try {
      return await this.fileManager.createFile(this.config, images, id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

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

  async uploadMaterial(file: Express.Multer.File, id: number) {
    try {
      return await this.fileManager.uploadMainFile(this.config, file, id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async showMaterial(id: number, @Res() res: Response) {
    return this.fileManager.showMainFile(this.config, id, res);
  }

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

  async showMaterialProfile(id: number, @Res() res: Response) {
    return this.fileManager.showProfileImage(this.config, id, res);
  }

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

  async showMaterialCover(id: number, @Res() res: Response) {
    return this.fileManager.showCoverImage(this.config, id, res);
  }

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

  async showMaterialImage(id: number, @Res() res: Response) {
    return this.fileManager.showImageById(this.config, id, res);
  }

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

  async showMaterialPreview(id: number, @Res() res: Response) {
    return this.fileManager.showPreviewById(this.config, id, res);
  }
}
