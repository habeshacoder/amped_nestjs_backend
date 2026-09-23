import { Response } from 'express';
import { statSync, createReadStream } from 'fs';
import { HttpStatus } from '@nestjs/common';

/**
 * Streams a local file to an Express response supporting HTTP byte ranges.
 *
 * If a Range header (e.g. `bytes=0-1024`) is supplied, responds with
 * HTTP 206 Partial Content, Content-Range, and chunk Content-Length.
 * If no range is specified, responds with HTTP 200 OK and full Content-Length.
 *
 * @param filePath Absolute path to the file to stream
 * @param range The HTTP Range header value (if provided)
 * @param res Express Response object
 */
export function streamByteRange(
  filePath: string,
  range: string | undefined,
  res: Response,
): void {
  const { size } = statSync(filePath);

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(filePath, {
      start,
      end,
      highWaterMark: 60,
    });

    const headers = {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': chunkSize,
    };

    res.writeHead(HttpStatus.PARTIAL_CONTENT, headers);
    stream.pipe(res);
  } else {
    const headers = {
      'Content-Length': size,
    };

    res.writeHead(HttpStatus.OK, headers);
    createReadStream(filePath).pipe(res);
  }
}
