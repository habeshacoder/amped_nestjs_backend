import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { NotFoundError } from '../exceptions/domain-exceptions';

export interface UploadedFileDescriptor {
  path?: string;
  filename?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

export type UploadedFileValue =
  | UploadedFileDescriptor
  | UploadedFileDescriptor[]
  | any;

export type UploadedImages = Record<string, UploadedFileValue>;
export type FileFieldMap = UploadedImages;

export interface ExtractedFiles {
  material?: string;
  profile?: string;
  cover?: string;
  preview?: string;
  image?: string;
  [key: string]: string | undefined;
}

export interface NamedFileRecord {
  id: number;
  image?: string | null;
  preview?: string | null;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  /**
   * Robustly extracts the basename from any file path regardless of Windows (\) or POSIX (/) separators.
   * Handles edge cases: empty strings, undefined/null, trailing slashes, multiple dots, no extension.
   */
  extractFileName(filePath?: string | null): string {
    if (!filePath || typeof filePath !== 'string') {
      return '';
    }

    const trimmed = filePath.trim();
    if (!trimmed) {
      return '';
    }

    // Split on both forward slash and backslash
    const segments = trimmed.split(/[/\\]+/).filter(Boolean);
    if (segments.length === 0) {
      return '';
    }

    return segments[segments.length - 1];
  }

  /**
   * Safely extracts the filename for a specified multipart field.
   * Handles both arrays (from FileFieldsInterceptor) and single file objects.
   */
  extractFieldFileName(
    files: UploadedImages | undefined | null,
    field: string,
  ): string | null {
    if (!files || !files[field]) {
      return null;
    }

    const fileValue = files[field];
    const fileDesc = Array.isArray(fileValue) ? fileValue[0] : fileValue;
    if (!fileDesc) {
      return null;
    }

    if (fileDesc.filename) {
      return fileDesc.filename;
    }

    if (fileDesc.path) {
      const extracted = this.extractFileName(fileDesc.path);
      return extracted || null;
    }

    return null;
  }

  /**
   * Extracts all standard media fields from an uploaded file map.
   */
  extractEntityFileNames(
    files: UploadedImages | undefined | null,
  ): ExtractedFiles {
    if (!files) {
      return {};
    }

    const result: ExtractedFiles = {};
    const candidateFields = [
      'material',
      'profile',
      'cover',
      'preview',
      'images',
      'image',
    ];

    for (const field of candidateFields) {
      const fileName = this.extractFieldFileName(files, field);
      if (fileName) {
        // Map 'images' field to 'image' if singular expected
        const targetKey = field === 'images' ? 'image' : field;
        result[targetKey] = fileName;
      }
    }

    return result;
  }

  /**
   * Executes a typed persistence transaction with extracted file names.
   */
  async createEntityFiles<T>(
    files: UploadedImages,
    executor: (extracted: ExtractedFiles) => Promise<T>,
  ): Promise<T> {
    const extracted = this.extractEntityFileNames(files);
    return executor(extracted);
  }

  /**
   * Safely deletes a file from the uploads directory without throwing if missing.
   */
  async deleteFile(
    subDirectory: string,
    fileName?: string | null,
  ): Promise<boolean> {
    if (!fileName) {
      return false;
    }

    const cleanFileName = this.extractFileName(fileName);
    if (!cleanFileName) {
      return false;
    }

    const fullPath = path.join(
      process.cwd(),
      'uploads',
      subDirectory,
      cleanFileName,
    );

    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.warn(
        `Failed to remove file ${fullPath}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  sendUploadedFile(
    res: Response,
    subDirectory: string,
    fileName?: string | null,
    notFoundMsg = 'File not found',
  ) {
    if (!fileName) {
      throw new NotFoundError(notFoundMsg, 'FILE_NOT_FOUND');
    }
    return res.sendFile(
      path.join(process.cwd(), 'uploads', subDirectory, fileName),
    );
  }

  async updateRelatedFileRecord<T extends NamedFileRecord>(
    files: UploadedImages,
    field: string,
    successMessage: string,
    subDirectory: string,
    findRecord: () => Promise<T | null>,
    createRecord: (fileName: string) => Promise<unknown>,
    updateRecord: (id: number, fileName: string) => Promise<unknown>,
  ) {
    const fileName = this.extractFieldFileName(files, field);
    if (!fileName) {
      return { message: successMessage };
    }

    const existing = await findRecord();
    if (existing) {
      await updateRecord(existing.id, fileName);
      const oldFile = existing.image || existing.preview;
      if (oldFile) {
        await this.deleteFile(subDirectory, oldFile);
      }
    } else {
      await createRecord(fileName);
    }
    return { message: successMessage };
  }

  async uploadRelatedFileRecord<T extends NamedFileRecord>(
    file: Express.Multer.File,
    subDirectory: string,
    findRecord: () => Promise<T | null>,
    createRecord: (fileName: string) => Promise<T>,
    updateRecord: (id: number, fileName: string) => Promise<T>,
  ) {
    const fileName = this.extractFileName(file?.filename || file?.path);
    const existing = await findRecord();

    if (!existing) {
      return await createRecord(fileName);
    }

    const updated = await updateRecord(existing.id, fileName);
    const oldFile = existing.image || existing.preview;
    if (oldFile && oldFile !== 'null') {
      await this.deleteFile(subDirectory, oldFile);
    }
    return updated;
  }
}
