import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface FileValidationRule {
  required?: boolean;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface FileFieldsValidationOptions {
  fields: Record<string, FileValidationRule>;
}

@Injectable()
export class FileFieldsValidationPipe implements PipeTransform {
  constructor(private readonly options: FileFieldsValidationOptions) {}

  transform(
    files:
      | Record<string, Express.Multer.File[] | Express.Multer.File>
      | undefined,
  ) {
    if (
      !files ||
      typeof files !== 'object' ||
      Object.keys(files).length === 0
    ) {
      const anyRequired = Object.entries(this.options.fields).some(
        ([, rule]) => rule.required,
      );
      if (anyRequired) {
        throw new BadRequestException('No files uploaded');
      }
      return files || {};
    }

    for (const [fieldName, rule] of Object.entries(this.options.fields)) {
      const fieldFiles = files[fieldName];

      if (
        !fieldFiles ||
        (Array.isArray(fieldFiles) && fieldFiles.length === 0)
      ) {
        if (rule.required) {
          throw new BadRequestException(
            `Field '${fieldName}' is required and must contain at least one file`,
          );
        }
        continue;
      }

      const fileList: Express.Multer.File[] = Array.isArray(fieldFiles)
        ? fieldFiles
        : [fieldFiles];

      for (const file of fileList) {
        if (!file) continue;

        if (rule.maxSizeBytes && file.size && file.size > rule.maxSizeBytes) {
          throw new BadRequestException(
            `File '${file.originalname || fieldName}' exceeds maximum size of ${
              rule.maxSizeBytes
            } bytes`,
          );
        }

        if (
          rule.allowedMimeTypes &&
          rule.allowedMimeTypes.length > 0 &&
          file.mimetype
        ) {
          const isAllowed = rule.allowedMimeTypes.some((allowed) => {
            if (allowed.endsWith('/*')) {
              const prefix = allowed.slice(0, -2);
              return file.mimetype.startsWith(prefix);
            }
            return file.mimetype === allowed;
          });

          if (!isAllowed) {
            throw new BadRequestException(
              `File '${
                file.originalname || fieldName
              }' has invalid MIME type '${
                file.mimetype
              }'. Allowed: ${rule.allowedMimeTypes.join(', ')}`,
            );
          }
        }
      }
    }

    return files;
  }
}
