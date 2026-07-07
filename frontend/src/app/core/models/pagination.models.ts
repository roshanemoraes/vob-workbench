export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListQuery {
  cursor?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchField?: string;
}
