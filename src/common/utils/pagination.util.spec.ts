import { computePagination } from './pagination.util';
import {
  NotFoundError,
  ValidationError,
} from '../exceptions/domain-exceptions';

describe('computePagination', () => {
  describe('validation', () => {
    it('should throw ValidationError when limit is 0', () => {
      expect(() => computePagination({ total: 10, limit: 0, page: 0 })).toThrow(
        ValidationError,
      );
      expect(() => computePagination(10, 0, 0)).toThrow(ValidationError);
    });

    it('should throw ValidationError when limit is negative', () => {
      expect(() =>
        computePagination({ total: 10, limit: -5, page: 0 }),
      ).toThrow(ValidationError);
      expect(() => computePagination(10, -5, 0)).toThrow(ValidationError);
    });

    it('should throw ValidationError when total is negative', () => {
      expect(() =>
        computePagination({ total: -1, limit: 10, page: 0 }),
      ).toThrow(ValidationError);
      expect(() => computePagination(-1, 10, 0)).toThrow(ValidationError);
    });
  });

  describe('empty results (total = 0)', () => {
    it('should handle total = 0 and page = 0 without baseUrl', () => {
      const result = computePagination({ total: 0, limit: 10, page: 0 });
      expect(result).toEqual({
        skip: 0,
        take: 10,
        meta: {
          self: 0,
          prev: null,
          next: null,
          last: 0,
        },
      });
    });

    it('should handle total = 0 and page = 0 with baseUrl', () => {
      const baseUrl = 'http://localhost:3000/items';
      const result = computePagination(0, 10, 0, baseUrl);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(10);
      expect(result.meta.Num_Of_Materials).toBe(0);
      expect(result.meta.Num_Of_Pages).toBe(0);
      expect(result.meta.Per_Page).toBe(10);
      expect(result.meta.Materials_In_last_page).toBe(0);
      expect(result.meta.Links).toEqual([
        { first: `${baseUrl}?take=10&page=0` },
        { self: `${baseUrl}?take=10&page=0` },
        { prev: `${baseUrl}?take=10&page=null` },
        { next: `${baseUrl}?take=10&page=null` },
        { last: `${baseUrl}?take=10&page=0` },
      ]);
    });

    it('should throw NotFoundError if total = 0 but page > 0', () => {
      expect(() => computePagination({ total: 0, limit: 10, page: 1 })).toThrow(
        NotFoundError,
      );
      expect(() => computePagination(0, 10, 1)).toThrow(NotFoundError);
    });
  });

  describe('page navigation and boundaries', () => {
    const baseUrl = 'http://localhost:3000/items';

    it('should compute page 0 (first page)', () => {
      const result = computePagination({
        total: 25,
        limit: 10,
        page: 0,
        baseUrl,
      });

      expect(result.skip).toBe(0);
      expect(result.take).toBe(10);
      expect(result.meta.self).toBe(0);
      expect(result.meta.prev).toBeNull();
      expect(result.meta.next).toBe(1);
      expect(result.meta.last).toBe(2);
      expect(result.meta.Num_Of_Materials).toBe(25);
      expect(result.meta.Num_Of_Pages).toBe(3);
      expect(result.meta.Materials_In_last_page).toBe(5);
      expect(result.meta.Links[0]).toEqual({
        first: `${baseUrl}?take=10&page=0`,
      });
      expect(result.meta.Links[1]).toEqual({
        self: `${baseUrl}?take=10&page=0`,
      });
      expect(result.meta.Links[2]).toEqual({
        prev: `${baseUrl}?take=10&page=null`,
      });
      expect(result.meta.Links[3]).toEqual({
        next: `${baseUrl}?take=10&page=1`,
      });
      expect(result.meta.Links[4]).toEqual({
        last: `${baseUrl}?take=10&page=2`,
      });
    });

    it('should compute page 1 (middle page)', () => {
      const result = computePagination(25, 10, 1, baseUrl);

      expect(result.skip).toBe(10);
      expect(result.take).toBe(10);
      expect(result.meta.self).toBe(1);
      expect(result.meta.prev).toBe(0);
      expect(result.meta.next).toBe(2);
      expect(result.meta.last).toBe(2);
      expect(result.meta.Links[2]).toEqual({
        prev: `${baseUrl}?take=10&page=0`,
      });
      expect(result.meta.Links[3]).toEqual({
        next: `${baseUrl}?take=10&page=2`,
      });
    });

    it('should compute last page (page 2)', () => {
      const result = computePagination({
        total: 25,
        limit: 10,
        page: 2,
        baseUrl,
      });

      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
      expect(result.meta.self).toBe(2);
      expect(result.meta.prev).toBe(1);
      expect(result.meta.next).toBeNull();
      expect(result.meta.last).toBe(2);
      expect(result.meta.Materials_In_last_page).toBe(5);
      expect(result.meta.Links[3]).toEqual({
        next: `${baseUrl}?take=10&page=null`,
      });
      expect(result.meta.Links[4]).toEqual({
        last: `${baseUrl}?take=10&page=2`,
      });
    });

    it('should compute last page when total is evenly divisible by limit', () => {
      const result = computePagination({
        total: 20,
        limit: 10,
        page: 1,
        baseUrl,
      });

      expect(result.skip).toBe(10);
      expect(result.meta.Materials_In_last_page).toBe(10);
      expect(result.meta.last).toBe(1);
    });

    it('should compute without baseUrl', () => {
      const result = computePagination(25, 10, 1);

      expect(result.skip).toBe(10);
      expect(result.take).toBe(10);
      expect(result.meta).toEqual({
        self: 1,
        prev: 0,
        next: 2,
        last: 2,
      });
      expect(result.meta.Links).toBeUndefined();
    });

    it('should throw NotFoundError when page is beyond range', () => {
      expect(() =>
        computePagination({ total: 25, limit: 10, page: 3 }),
      ).toThrow(NotFoundError);
      expect(() => computePagination(25, 10, 99)).toThrow(NotFoundError);
    });

    it('should throw NotFoundError when page is negative', () => {
      expect(() =>
        computePagination({ total: 25, limit: 10, page: -1 }),
      ).toThrow(NotFoundError);
      expect(() => computePagination(25, 10, -1)).toThrow(NotFoundError);
    });
  });
});
