import {
  applyDecorators,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { editFileName } from '../utils/file-upload.utils';
import { FileFieldsValidationPipe } from '../pipes/file-fields-validation.pipe';
import { JwtGuard } from '../../auth/guard/jwt.guard';

export const MATERIAL_FILE_FIELDS = [
  { name: 'material', maxCount: 1 },
  { name: 'profile', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'preview', maxCount: 1 },
];

export const MATERIAL_VALIDATION_SCHEMA = {
  material: {
    required: false,
    maxSizeBytes: 200 * 1024 * 1024,
    allowedMimeTypes: [
      'audio/*',
      'video/*',
      'application/epub+zip',
      'application/pdf',
      'application/octet-stream',
    ],
  },
  profile: {
    required: false,
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/*'],
  },
  cover: {
    required: false,
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/*'],
  },
  images: {
    required: false,
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/*'],
  },
  preview: {
    required: false,
    maxSizeBytes: 50 * 1024 * 1024,
    allowedMimeTypes: ['audio/*', 'video/*', 'image/*'],
  },
};

function normalizeDestination(destination: string): string {
  if (destination.startsWith('./uploads/')) {
    return destination.endsWith('/') ? destination : `${destination}/`;
  }
  const cleaned = destination.replace(/^\/+|\/+$/g, '');
  return `./uploads/${cleaned}/`;
}

function buildFileFieldsUploadInterceptor(
  fields: { name: string; maxCount: number }[],
  destinationFolder: string,
) {
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(fields, {
        storage: diskStorage({
          destination: normalizeDestination(destinationFolder),
          filename: editFileName,
        }),
        limits: {
          fileSize: 200 * 1024 * 1024,
        },
      }),
    ),
    Throttle({ default: { limit: 20, ttl: 60000 } }),
  );
}

/**
 * Creates a FileFieldsInterceptor decorator configured for material/channel-material multi-field uploads
 * with rate limiting (20 req / min) and size limits.
 */
export function MaterialFilesUploadInterceptor(destinationFolder: string) {
  return buildFileFieldsUploadInterceptor(
    MATERIAL_FILE_FIELDS,
    destinationFolder,
  );
}

/**
 * Creates a FileFieldsInterceptor decorator configured for a single file/field upload
 * with rate limiting (20 req / min) and size limits.
 */
export function SingleFileUploadInterceptor(
  fieldName: string,
  destinationFolder: string,
  maxCount = 1,
) {
  return buildFileFieldsUploadInterceptor(
    [{ name: fieldName, maxCount }],
    destinationFolder,
  );
}

/**
 * Composite route decorator reducing boilerplate for material file upload PATCH endpoints.
 */
export function MaterialFileUploadPatch(
  path: string,
  fieldName: string,
  maxCount = 1,
) {
  return applyDecorators(
    UseGuards(JwtGuard),
    Patch(path),
    HttpCode(HttpStatus.CREATED),
    SingleFileUploadInterceptor(fieldName, 'material', maxCount),
  );
}

/**
 * Composite route decorator reducing boilerplate for material multi-file upload POST endpoints.
 */
export function MaterialFilesUploadPost(path: string, folder = 'material') {
  return applyDecorators(
    UseGuards(JwtGuard),
    Post(path),
    HttpCode(HttpStatus.CREATED),
    MaterialFilesUploadInterceptor(folder),
  );
}

/**
 * Convenience parameter decorator combining @UploadedFiles with single file validation pipe.
 */
export const UploadedSingleFile = (
  fieldName: string,
  options?: {
    required?: boolean;
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
  },
) => UploadedFiles(createSingleFileValidationPipe(fieldName, options));

/**
 * Convenience parameter decorator for integer entity IDs.
 */
export const IdParam = (paramName = 'id') => Param(paramName, ParseIntPipe);

/**
 * Factory for creating standard multi-file validation pipe for material entities.
 */
export function createMaterialFilesValidationPipe() {
  return new FileFieldsValidationPipe({ fields: MATERIAL_VALIDATION_SCHEMA });
}

/**
 * Factory for creating validation pipes for single file upload endpoints.
 */
export function createSingleFileValidationPipe(
  fieldName: string,
  options?: {
    required?: boolean;
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
  },
) {
  return new FileFieldsValidationPipe({
    fields: {
      [fieldName]: {
        required: options?.required ?? true,
        maxSizeBytes: options?.maxSizeBytes ?? 10 * 1024 * 1024,
        ...(options?.allowedMimeTypes
          ? { allowedMimeTypes: options.allowedMimeTypes }
          : {}),
      },
    },
  });
}
