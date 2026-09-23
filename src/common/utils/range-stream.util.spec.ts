import { streamByteRange } from './range-stream.util';
import { HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { Response } from 'express';

jest.mock('fs', () => ({
  statSync: jest.fn(),
  createReadStream: jest.fn(),
}));

describe('streamByteRange', () => {
  let mockRes: Partial<Response>;
  let mockPipe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPipe = jest.fn();
    (fs.createReadStream as jest.Mock).mockReturnValue({
      pipe: mockPipe,
    });
    mockRes = {
      writeHead: jest.fn(),
    };
  });

  it('should stream entire file with 200 OK when range header is undefined', () => {
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });

    streamByteRange('/path/to/file.mp3', undefined, mockRes as Response);

    expect(fs.statSync).toHaveBeenCalledWith('/path/to/file.mp3');
    expect(mockRes.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
      'Content-Length': 1024,
    });
    expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/file.mp3');
    expect(mockPipe).toHaveBeenCalledWith(mockRes);
  });

  it('should stream partial content with 206 Partial Content when closed range is provided', () => {
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });

    streamByteRange('/path/to/file.mp3', 'bytes=100-200', mockRes as Response);

    expect(fs.statSync).toHaveBeenCalledWith('/path/to/file.mp3');
    expect(mockRes.writeHead).toHaveBeenCalledWith(HttpStatus.PARTIAL_CONTENT, {
      'Content-Range': 'bytes 100-200/1000',
      'Content-Length': 101,
    });
    expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/file.mp3', {
      start: 100,
      end: 200,
      highWaterMark: 60,
    });
    expect(mockPipe).toHaveBeenCalledWith(mockRes);
  });

  it('should handle open-ended range correctly (bytes=50-)', () => {
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });

    streamByteRange('/path/to/file.epub', 'bytes=50-', mockRes as Response);

    expect(mockRes.writeHead).toHaveBeenCalledWith(HttpStatus.PARTIAL_CONTENT, {
      'Content-Range': 'bytes 50-999/1000',
      'Content-Length': 950,
    });
    expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/file.epub', {
      start: 50,
      end: 999,
      highWaterMark: 60,
    });
    expect(mockPipe).toHaveBeenCalledWith(mockRes);
  });
});
