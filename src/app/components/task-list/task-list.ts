import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { LucideAngularModule, Calendar } from 'lucide-angular';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilter,
  TaskSort,
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
  filteredAndSortedTasks$: Observable<any>;

  currentFilter: TaskFilter = {
    status: undefined,
    priority: undefined,
    categoryId: '',
    title: '',
  };
  currentSort: TaskSort = { field: 'title', direction: 'asc' };

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  dateFromInput: string = '';
  dateToInput: string = '';

  readonly calendarIcon = Calendar;

  public taskService = inject(TaskService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  constructor() {
    this.categories$ = this.categoryService.getAllCategories();
    this.filteredAndSortedTasks$ = this.taskService.filteredAndSortedTasks$;
    this.taskService.setFilter(this.currentFilter);
    this.taskService.setSort(this.currentSort);
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

  applyFilters() {
    const newFilter = {
      ...this.currentFilter,
      dateFrom: this.dateFromInput ? new Date(this.dateFromInput) : undefined,
      dateTo: this.dateToInput ? new Date(this.dateToInput) : undefined,
    };
    this.taskService.setFilter(newFilter);
  }

  applySort() {
    this.taskService.setSort(this.currentSort);
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
    this.taskService.setFilter(this.currentFilter);
    this.taskService.setSort(this.currentSort);
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
    if (!categoryId)
      return new Observable((observer) => observer.next('No Category'));

    return this.categoryService
      .getCategoryById(categoryId)
      .pipe(map((category) => category?.title || 'Unknown Category'));
  }

  getCategoryColor(categoryId?: string): Observable<string> {
    if (!categoryId)
      return new Observable((observer) => observer.next('#6b7280'));

    return this.categoryService
      .getCategoryById(categoryId)
      .pipe(map((category) => category?.color || '#6b7280'));
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
