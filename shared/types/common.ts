// 通用類型定義

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date;
}

export type Status = 'active' | 'inactive' | 'draft' | 'archived';

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: string;
  direction: SortDirection;
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between';
  value: any;
}

export interface SearchParams {
  page?: number;
  limit?: number;
  sort?: SortOption[];
  filters?: FilterOption[];
  search?: string;
  searchFields?: string[];
}

export interface Address {
  recipientName: string;
  phone: string;
  zipCode: string;
  city: string;
  district: string;
  addressLine: string;
  addressType: 'shipping' | 'billing';
  isDefault: boolean;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Image {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface SEO {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface AuditInfo {
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}