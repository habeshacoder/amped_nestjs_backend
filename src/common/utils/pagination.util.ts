import {
  NotFoundError,
  ValidationError,
} from '../exceptions/domain-exceptions';

export interface PaginationInput {
  total: number;
  limit: number;
  page: number;
  baseUrl?: string;
}

export interface PaginationResult {
  skip: number;
  take: number;
  meta: Record<string, any>;
}

export function computePagination(
  inputOrTotal: PaginationInput | number,
  limitArg?: number,
  pageArg?: number,
  baseUrlArg?: string,
): PaginationResult {
  let total: number;
  let limit: number;
  let page: number;
  let baseUrl: string | undefined;

  if (typeof inputOrTotal === 'object' && inputOrTotal !== null) {
    total = inputOrTotal.total;
    limit = inputOrTotal.limit;
    page = inputOrTotal.page;
    baseUrl = inputOrTotal.baseUrl;
  } else {
    total = inputOrTotal;
    limit = limitArg!;
    page = pageArg!;
    baseUrl = baseUrlArg;
  }

  if (
    limit === undefined ||
    limit === null ||
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    throw new ValidationError('Limit must be greater than 0', 'INVALID_LIMIT');
  }

  if (
    total === undefined ||
    total === null ||
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new ValidationError('Total cannot be negative', 'INVALID_TOTAL');
  }

  if (total === 0) {
    if (page !== 0) {
      throw new NotFoundError('Page Not Found', 'PAGE_NOT_FOUND');
    }
    const meta: Record<string, any> = {
      self: 0,
      prev: null,
      next: null,
      last: 0,
    };
    if (baseUrl) {
      meta.Num_Of_Materials = 0;
      meta.Num_Of_Pages = 0;
      meta.Per_Page = limit;
      meta.Materials_In_last_page = 0;
      meta.Links = [
        { first: `${baseUrl}?take=${limit}&page=0` },
        { self: `${baseUrl}?take=${limit}&page=0` },
        { prev: `${baseUrl}?take=${limit}&page=null` },
        { next: `${baseUrl}?take=${limit}&page=null` },
        { last: `${baseUrl}?take=${limit}&page=0` },
      ];
    }
    return { skip: 0, take: limit, meta };
  }

  const totalPages = Math.ceil(total / limit);
  if (page < 0 || page >= totalPages) {
    throw new NotFoundError('Page Not Found', 'PAGE_NOT_FOUND');
  }

  const previousPage = page === 0 ? null : page - 1;
  const nextPage = page + 1 >= totalPages ? null : page + 1;
  const lastPage = totalPages - 1;
  let materialsInLastPage = total % limit;
  if (materialsInLastPage === 0) {
    materialsInLastPage = limit;
  }

  const meta: Record<string, any> = {
    self: page,
    prev: previousPage,
    next: nextPage,
    last: lastPage,
  };

  if (baseUrl) {
    meta.Num_Of_Materials = total;
    meta.Num_Of_Pages = totalPages;
    meta.Per_Page = limit;
    meta.Materials_In_last_page = materialsInLastPage;
    meta.Links = [
      { first: `${baseUrl}?take=${limit}&page=0` },
      { self: `${baseUrl}?take=${limit}&page=${page}` },
      { prev: `${baseUrl}?take=${limit}&page=${previousPage}` },
      { next: `${baseUrl}?take=${limit}&page=${nextPage}` },
      { last: `${baseUrl}?take=${limit}&page=${lastPage}` },
    ];
  }

  return { skip: limit * page, take: limit, meta };
}
