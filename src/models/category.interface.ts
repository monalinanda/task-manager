import { Task } from './task.interface';

export interface Category {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
}

export interface CategoryFilter {
  title?: string;
}

export interface CategorySort {
  field: 'title' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface CreateCategoryRequest {
  title: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  title?: string;
  description?: string;
  color?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
