import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { TaskService } from '../../../services/task.service';
import {
  CategoryFilter,
  CategorySort,
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
export class CategoryList {
  filteredAndSortedCategories$: Observable<any>;

  currentFilter: CategoryFilter = {};
  currentSort: CategorySort = { field: 'title', direction: 'asc' };

  constructor(
    private categoryService: CategoryService,
    private taskService: TaskService,
    private router: Router
  ) {
    this.filteredAndSortedCategories$ =
      this.categoryService.filteredAndSortedCategories$;
  }

  navigateToCreateCategory() {
    this.router.navigate(['/categories/new']);
  }

  editCategory(id: string) {
    this.router.navigate(['/categories', id, 'edit']);
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => console.log('Category deleted successfully'),
        error: (error) => console.error('Error deleting task:', error),
      });
    }
  }

  applyFilters() {
    this.categoryService.setFilter(this.currentFilter);
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
    this.categoryService.setFilter(this.currentFilter);
    this.categoryService.setSort(this.currentSort);
  }

  previousPage() {
    this.categoryService.setPage(1); // Simplified for demo
  }

  nextPage() {
    this.categoryService.setPage(2); // Simplified for demo
  }

  getCategoryTaskCount(categoryId: string): Observable<number> {
    return this.taskService
      .getTasksByCategory(categoryId)
      .pipe(map((tasks) => tasks.length));
  }

  getCategoryTasks(categoryId: string): Observable<Task[]> {
    return this.taskService.getTasksByCategory(categoryId);
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
