import { BadRequestException } from '@nestjs/common';
import {
  FileFieldsValidationPipe,
  FileFieldsValidationOptions,
} from './file-fields-validation.pipe';

describe('FileFieldsValidationPipe', () => {
  const options: FileFieldsValidationOptions = {
    fields: {
      material: {
        required: true,
        maxSizeBytes: 50 * 1024 * 1024,
        allowedMimeTypes: [
          'audio/mpeg',
          'application/epub+zip',
          'application/pdf',
        ],
      },
      cover: {
        required: false,
        maxSizeBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/*'],
      },
    },
  };

  let pipe: FileFieldsValidationPipe;

  beforeEach(() => {
    pipe = new FileFieldsValidationPipe(options);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw BadRequestException if no files uploaded when required', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if required field is missing', () => {
    const files = {
      cover: [
        {
          originalname: 'cover.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        } as Express.Multer.File,
      ],
    };

    expect(() => pipe.transform(files)).toThrow(/Field 'material' is required/);
  });

  it('should throw BadRequestException if required field is an empty array', () => {
    const files = {
      material: [],
    };

    expect(() => pipe.transform(files)).toThrow(/Field 'material' is required/);
  });

  it('should throw BadRequestException if file exceeds maximum allowed size', () => {
    const files = {
      material: [
        {
          originalname: 'book.epub',
          mimetype: 'application/epub+zip',
          size: 60 * 1024 * 1024, // 60MB > 50MB
        } as Express.Multer.File,
      ],
    };

    expect(() => pipe.transform(files)).toThrow(/exceeds maximum size/);
  });

  it('should throw BadRequestException if MIME type is not allowed', () => {
    const files = {
      material: [
        {
          originalname: 'script.sh',
          mimetype: 'application/x-sh',
          size: 1024,
        } as Express.Multer.File,
      ],
    };

    expect(() => pipe.transform(files)).toThrow(/invalid MIME type/);
  });

  it('should accept allowed wildcard MIME types like image/*', () => {
    const files = {
      material: [
        {
          originalname: 'audio.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
        } as Express.Multer.File,
      ],
      cover: [
        {
          originalname: 'cover.png',
          mimetype: 'image/png',
          size: 2 * 1024 * 1024,
        } as Express.Multer.File,
      ],
    };

    const result = pipe.transform(files);
    expect(result).toEqual(files);
  });

  it('should allow omitting optional fields', () => {
    const files = {
      material: [
        {
          originalname: 'audio.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
        } as Express.Multer.File,
      ],
    };

    const result = pipe.transform(files);
    expect(result).toEqual(files);
  });

  it('should pass if no required fields and no files uploaded', () => {
    const optionalPipe = new FileFieldsValidationPipe({
      fields: {
        cover: { required: false },
      },
    });

    const result = optionalPipe.transform({});
    expect(result).toEqual({});
  });
});
