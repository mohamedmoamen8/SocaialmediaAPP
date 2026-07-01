import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (query: Request['query']): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const paginatedResponse = (data: unknown[], total: number, { page, limit }: PaginationParams) => ({
  data,
  pagination: { total, page, limit, pages: Math.ceil(total / limit) },
});
