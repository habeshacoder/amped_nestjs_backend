import { imageFileFilter, fileFilter, editFileName } from './file-upload.utils';

describe('file-upload.utils', () => {
  describe('imageFileFilter', () => {
    it('should allow valid image extensions and image mimetype', () => {
      const cb = jest.fn();
      imageFileFilter(
        {},
        { originalname: 'avatar.png', mimetype: 'image/png' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-image file extensions', () => {
      const cb = jest.fn();
      imageFileFilter(
        {},
        { originalname: 'document.pdf', mimetype: 'application/pdf' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only image files are allowed!',
        }),
        false,
      );
    });

    it('should reject image file extension if mimetype is not image/*', () => {
      const cb = jest.fn();
      imageFileFilter(
        {},
        { originalname: 'malicious.png', mimetype: 'application/x-executable' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only image files are allowed!',
        }),
        false,
      );
    });

    it('should accept valid image without mimetype specified', () => {
      const cb = jest.fn();
      imageFileFilter({}, { originalname: 'photo.jpg' }, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });

  describe('fileFilter', () => {
    it('should accept valid epub, wav, or mp3 files', () => {
      const cb = jest.fn();
      fileFilter(
        {},
        { originalname: 'audiobook.mp3', mimetype: 'audio/mpeg' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept epub with application/epub+zip mimetype', () => {
      const cb = jest.fn();
      fileFilter(
        {},
        { originalname: 'book.epub', mimetype: 'application/epub+zip' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept epub with application/octet-stream mimetype', () => {
      const cb = jest.fn();
      fileFilter(
        {},
        { originalname: 'book.epub', mimetype: 'application/octet-stream' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject unsupported file extension', () => {
      const cb = jest.fn();
      fileFilter(
        {},
        { originalname: 'archive.zip', mimetype: 'audio/mpeg' },
        cb,
      );

      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only files with .epub, .wav or .mp3 are allowed!',
        }),
        false,
      );
    });

    it('should reject supported extension if mimetype is invalid', () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: 'audio.mp3', mimetype: 'text/html' }, cb);

      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only files with .epub, .wav or .mp3 are allowed!',
        }),
        false,
      );
    });
  });

  describe('editFileName', () => {
    it('should generate a randomized file name preserving original extension', () => {
      const cb = jest.fn();
      editFileName({}, { originalname: 'original_photo.jpg' }, cb);

      expect(cb).toHaveBeenCalledWith(
        null,
        expect.stringMatching(/^\d+-\d+\.jpg$/),
      );
    });
  });
});
