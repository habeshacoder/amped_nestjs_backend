import { UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from '../utils/file-upload.utils';
import { FileFieldsValidationPipe } from '../pipes/file-fields-validation.pipe';

export const MATERIAL_FILE_FIELDS = [
  { name: 'material', maxCount: 1 },
  { name: 'profile', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'preview', maxCount: 1 },
];

export const MATERIAL_VALIDATION_SCHEMA = {
  material: { required: false, maxSizeBytes: 200 * 1024 * 1024 },
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
  preview: { required: false, maxSizeBytes: 50 * 1024 * 1024 },
};

function normalizeDestination(destination: string): string {
  if (destination.startsWith('./uploads/')) {
    return destination.endsWith('/') ? destination : `${destination}/`;
  }
  const cleaned = destination.replace(/^\/+|\/+$/g, '');
  return `./uploads/${cleaned}/`;
}

/**
 * Creates a FileFieldsInterceptor decorator configured for material/channel-material multi-field uploads.
 */
export function MaterialFilesUploadInterceptor(destinationFolder: string) {
  return UseInterceptors(
    FileFieldsInterceptor(MATERIAL_FILE_FIELDS, {
      storage: diskStorage({
        destination: normalizeDestination(destinationFolder),
        filename: editFileName,
      }),
    }),
  );
}

/**
 * Creates a FileFieldsInterceptor decorator configured for a single file/field upload.
 */
export function SingleFileUploadInterceptor(
  fieldName: string,
  destinationFolder: string,
  maxCount = 1,
) {
  return UseInterceptors(
    FileFieldsInterceptor([{ name: fieldName, maxCount }], {
      storage: diskStorage({
        destination: normalizeDestination(destinationFolder),
        filename: editFileName,
      }),
    }),
  );
}

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
