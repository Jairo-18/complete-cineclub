export interface PaginationInterface {
  title?: string;
  size: number;
  page: number;
  perPage?: number;
  total: number;
  totalPages?: number;
  pageCount?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface ParamsPaginationInterface {
  order?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
  search?: string;
  userId?: string;
}
