import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { LucideAngularModule, Calendar } from 'lucide-angular';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilter,
  TaskSort,
  PaginatedResponse,
} from '../../../models/task.interface';
import { Category } from '../../../models/category.interface';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  categories$: Observable<Category[]>;
  tasks$: Observable<PaginatedResponse<Task>>;
  categoryMap = new Map<string, Category>();

  currentFilter: TaskFilter = {
    status: undefined,
    priority: undefined,
    categoryId: '',
    title: '',
  };
  currentSort: TaskSort = { field: 'title', direction: 'asc' };
  currentPage = 1;
  pageSize = 10;

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  dateFromInput: string = '';
  dateToInput: string = '';

  readonly calendarIcon = Calendar;

  constructor(
    public taskService: TaskService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.tasks$ = this.taskService.tasks$;

    // Load and cache categories
    this.categories$ = this.categoryService.getAllCategories().pipe(
      tap((categories) => {
        // Update category map for quick lookups
        this.categoryMap.clear();
        categories.forEach((cat) => this.categoryMap.set(cat.id, cat));
      })
    );

    this.taskService.setFilter(this.currentFilter);
    this.taskService.setSort(this.currentSort);
    this.taskService.setPagination({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  navigateToCreateTask() {
    this.router.navigate(['/tasks/new']);
  }

  editTask(id: string) {
    this.router.navigate(['/tasks', id, 'edit']);
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => console.log('Task deleted successfully'),
        error: (error) => console.error('Error deleting task:', error),
      });
    }
  }

  retryLoad() {
    window.location.reload();
  }

  onSearch(term: string) {
    this.taskService.setSearch(term);
  }

  applyFilters() {
    const newFilter = {
      ...this.currentFilter,
      dateFrom: this.dateFromInput ? new Date(this.dateFromInput) : undefined,
      dateTo: this.dateToInput ? new Date(this.dateToInput) : undefined,
    };
    this.taskService.setFilter(newFilter);
  }

  clearFilters() {
    this.currentFilter = {
      status: undefined,
      priority: undefined,
      categoryId: '',
      title: '',
    };
    this.currentSort = { field: 'title', direction: 'asc' };
    this.dateFromInput = '';
    this.dateToInput = '';
    this.currentPage = 1;
    this.taskService.setFilter(this.currentFilter);
    this.taskService.setSort(this.currentSort);
    this.taskService.setPagination({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.taskService.setPagination({ page, pageSize: this.pageSize });
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'status-todo';
      case TaskStatus.IN_PROGRESS:
        return 'status-progress';
      case TaskStatus.DONE:
        return 'status-done';
      default:
        return '';
    }
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'priority-low';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.HIGH:
        return 'priority-high';
      default:
        return '';
    }
  }

  isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }

  getCategoryName(categoryId?: string): Observable<string> {
    if (!categoryId) return of('No Category');
    const category = this.categoryMap.get(categoryId);
    return category ? of(category.title) : of('Unknown Category');
  }

  getCategoryColor(categoryId?: string): Observable<string> {
    if (!categoryId) return of('#6b7280');
    const category = this.categoryMap.get(categoryId);
    return category ? of(category.color) : of('#6b7280');
  }

  toggleSort(field: 'title' | 'status') {
    if (this.currentSort.field === field) {
      this.currentSort = {
        ...this.currentSort,
        direction: this.currentSort.direction === 'asc' ? 'desc' : 'asc',
      };
    } else {
      this.currentSort = { field, direction: 'asc' };
    }
    this.taskService.setSort(this.currentSort);
  }
}
