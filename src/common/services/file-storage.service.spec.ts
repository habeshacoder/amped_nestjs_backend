import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageService, UploadedImages } from './file-storage.service';
import * as fs from 'fs';
import * as path from 'path';

describe('FileStorageService', () => {
  let service: FileStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileStorageService],
    }).compile();

    service = module.get<FileStorageService>(FileStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFileName', () => {
    it('should extract filename from POSIX paths', () => {
      expect(service.extractFileName('uploads/material/sample.epub')).toBe(
        'sample.epub',
      );
      expect(service.extractFileName('/var/www/uploads/cover-1234.png')).toBe(
        'cover-1234.png',
      );
    });

    it('should extract filename from Windows backslash paths', () => {
      expect(
        service.extractFileName('uploads\\material\\windows-doc.pdf'),
      ).toBe('windows-doc.pdf');
      expect(
        service.extractFileName('C:\\app\\uploads\\nested\\photo.jpg'),
      ).toBe('photo.jpg');
    });

    it('should handle mixed separators and trailing slashes', () => {
      expect(service.extractFileName('uploads/material\\sub/file.mp3/')).toBe(
        'file.mp3',
      );
      expect(
        service.extractFileName('uploads\\material/test-track.wav\\\\'),
      ).toBe('test-track.wav');
    });

    it('should handle filenames with multiple dots', () => {
      expect(
        service.extractFileName('uploads/releases/archive.v1.0.tar.gz'),
      ).toBe('archive.v1.0.tar.gz');
    });

    it('should handle filenames with no extension', () => {
      expect(service.extractFileName('/uploads/tmp/data-blob')).toBe(
        'data-blob',
      );
    });

    it('should return empty string for null, undefined, empty, or whitespace-only paths', () => {
      expect(service.extractFileName(null)).toBe('');
      expect(service.extractFileName(undefined)).toBe('');
      expect(service.extractFileName('')).toBe('');
      expect(service.extractFileName('   ')).toBe('');
    });
  });

  describe('extractFieldFileName', () => {
    it('should return filename when explicit filename property is present', () => {
      const files: UploadedImages = {
        cover: [{ filename: 'cover-final.jpg', path: 'temp/path/ignored' }],
      };
      expect(service.extractFieldFileName(files, 'cover')).toBe(
        'cover-final.jpg',
      );
    });

    it('should parse path when filename property is missing', () => {
      const files: UploadedImages = {
        material: [{ path: 'uploads/material/book.epub' }],
      };
      expect(service.extractFieldFileName(files, 'material')).toBe('book.epub');
    });

    it('should return null when field does not exist or is empty', () => {
      const files: UploadedImages = {
        material: [],
      };
      expect(service.extractFieldFileName(files, 'material')).toBeNull();
      expect(service.extractFieldFileName(files, 'cover')).toBeNull();
      expect(service.extractFieldFileName(null, 'material')).toBeNull();
      expect(service.extractFieldFileName(undefined, 'material')).toBeNull();
    });
  });

  describe('extractEntityFileNames', () => {
    it('should extract all present media fields and normalize "images" to "image"', () => {
      const files: UploadedImages = {
        material: [{ path: 'uploads/material/doc.epub' }],
        profile: [{ path: 'uploads/profile/avatar.png' }],
        cover: [{ path: 'uploads/cover/front.jpg' }],
        preview: [{ path: 'uploads/preview/clip.mp3' }],
        images: [{ path: 'uploads/images/gallery-1.jpg' }],
      };

      const extracted = service.extractEntityFileNames(files);
      expect(extracted).toEqual({
        material: 'doc.epub',
        profile: 'avatar.png',
        cover: 'front.jpg',
        preview: 'clip.mp3',
        image: 'gallery-1.jpg',
      });
    });

    it('should return empty object when files is undefined or null', () => {
      expect(service.extractEntityFileNames(null)).toEqual({});
      expect(service.extractEntityFileNames(undefined)).toEqual({});
    });
  });

  describe('createEntityFiles', () => {
    it('should execute executor function with extracted filenames', async () => {
      const files: UploadedImages = {
        material: [{ path: 'uploads/material/item.epub' }],
        cover: [{ path: 'uploads/cover/banner.jpg' }],
      };

      const mockExecutor = jest.fn().mockResolvedValue({ success: true });
      const result = await service.createEntityFiles(files, mockExecutor);

      expect(mockExecutor).toHaveBeenCalledWith({
        material: 'item.epub',
        cover: 'banner.jpg',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteFile', () => {
    it('should return false for falsy or empty filename', async () => {
      expect(await service.deleteFile('material', null)).toBe(false);
      expect(await service.deleteFile('material', undefined)).toBe(false);
      expect(await service.deleteFile('material', '')).toBe(false);
    });

    it('should safely return false when target file does not exist', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const result = await service.deleteFile('material', 'non-existent.epub');
      expect(result).toBe(false);
    });

    it('should unlink file and return true when file exists', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const unlinkSpy = jest
        .spyOn(fs.promises, 'unlink')
        .mockResolvedValue(undefined);

      const result = await service.deleteFile('material', 'to-delete.epub');

      expect(result).toBe(true);
      expect(unlinkSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), 'uploads', 'material', 'to-delete.epub'),
      );
      unlinkSpy.mockRestore();
    });
  });
});
