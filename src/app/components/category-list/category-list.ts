import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { TaskService } from '../../../services/task.service';
import {
  Category,
  CategoryFilter,
  CategorySort,
  PaginatedResponse,
} from '../../../models/category.interface';
import { Task } from '../../../models/task.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit {
  categories$: Observable<PaginatedResponse<Category>>;

  currentFilter: CategoryFilter = {};
  currentSort: CategorySort = { field: 'title', direction: 'asc' };
  currentPage = 1;
  pageSize = 10;

  constructor(
    public categoryService: CategoryService,
    private taskService: TaskService,
    private router: Router
  ) {
    this.categories$ = this.categoryService.categories$;
  }

  ngOnInit() {
    // Set initial pagination
    this.categoryService.setPagination({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  navigateToCreateCategory() {
    this.router.navigate(['/categories/new']);
  }

  editCategory(id: string) {
    this.router.navigate(['/categories', id, 'edit']);
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          console.log('Category deleted successfully');
          // Refresh the current page
          this.onPageChange(this.currentPage);
        },
        error: (error) => console.error('Error deleting category:', error),
      });
    }
  }

  onSearch(term: string) {
    this.categoryService.setSearch(term);
  }

  applyFilters() {
    this.currentPage = 1; // Reset to first page when filters change
    this.categoryService.setPagination({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  toggleSort(field: 'title' | 'createdAt') {
    if (this.currentSort.field === field) {
      this.currentSort = {
        ...this.currentSort,
        direction: this.currentSort.direction === 'asc' ? 'desc' : 'asc',
      };
    } else {
      this.currentSort = { field, direction: 'asc' };
    }
    this.categoryService.setSort(this.currentSort);
  }

  clearFilters() {
    this.currentFilter = {};
    this.currentSort = { field: 'title', direction: 'asc' };
    this.currentPage = 1;
    this.categoryService.setFilter(this.currentFilter);
    this.categoryService.setSort(this.currentSort);
    this.categoryService.setPagination({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.categoryService.setPagination({
      page,
      pageSize: this.pageSize,
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'To Do':
        return 'status-todo';
      case 'In Progress':
        return 'status-progress';
      case 'Done':
        return 'status-done';
      default:
        return '';
    }
  }
}
