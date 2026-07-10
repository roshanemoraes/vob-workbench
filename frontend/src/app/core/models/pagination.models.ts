export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface ListQuery {
  cursor?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchField?: string;
}
