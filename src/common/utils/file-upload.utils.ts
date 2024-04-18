/* eslint-disable prettier/prettier */
import { extname } from 'path';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|PNG|png|gif|webp)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }

  callback(null, true);
};

export const fileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(epub|wav|mp3)$/)) {
    return callback(
      new Error('Only files with .epub, .wav or .mp3 are allowed!'),
      false,
    );
  }

  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  const filename = `${uniqueSuffix}${ext}`;
  callback(null, filename);
};
