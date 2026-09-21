/* eslint-disable prettier/prettier */
import { extname } from 'path';

export const imageFileFilter = (
  req: any,
  file: { originalname: string; mimetype?: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|PNG|png|gif|webp)$/i)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  if (file.mimetype && !file.mimetype.startsWith('image/')) {
    return callback(new Error('Only image files are allowed!'), false);
  }

  callback(null, true);
};

export const fileFilter = (
  req: any,
  file: { originalname: string; mimetype?: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(epub|wav|mp3)$/i)) {
    return callback(
      new Error('Only files with .epub, .wav or .mp3 are allowed!'),
      false,
    );
  }
  if (
    file.mimetype &&
    !file.mimetype.startsWith('audio/') &&
    file.mimetype !== 'application/epub+zip' &&
    file.mimetype !== 'application/octet-stream'
  ) {
    return callback(
      new Error('Only files with .epub, .wav or .mp3 are allowed!'),
      false,
    );
  }

  callback(null, true);
};

export const editFileName = (
  req: any,
  file: { originalname: string },
  callback: (error: Error | null, filename: string) => void,
) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  const filename = `${uniqueSuffix}${ext}`;
  callback(null, filename);
};
