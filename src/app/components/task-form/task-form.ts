import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {
  Task,
  TaskStatus,
  TaskPriority,
  UpdateTaskRequest,
  CreateTaskRequest,
} from '../../../models/task.interface';
import { Category } from '../../../models/category.interface';
import { TaskService } from '../../../services/task.service';
import { CategoryService } from '../../../services/category.service';
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm {
  taskForm!: FormGroup;
  isEditMode = false;
  taskId?: string;
  categories$: Observable<Category[]>;

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  constructor(
    public taskService: TaskService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.categories$ = this.categoryService.getAllCategories();
  }

  ngOnInit() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: [TaskPriority.MEDIUM],
      status: [TaskStatus.TODO],
      categoryId: '',
    });
    this.taskId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.taskId;

    if (this.isEditMode && this.taskId) {
      this.taskService.getTaskById(this.taskId).subscribe((task) => {
        if (task) {
          console.log(task, 'taskkkk');
          this.taskForm.patchValue({
            ...task,
            dueDate: new Date(task.dueDate).toISOString().split('T')[0],
          });
          // this.dueDateString = this.formatDateForInput(task.dueDate);
        }
      });
    } else {
      // Set default due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.taskForm.value.dueDate = this.formatDateForInput(tomorrow);
    }
  }

  onSubmit() {
    if (!this.taskForm.value.title || !this.taskForm.value.dueDate) {
      return;
    }

    const dueDate = new Date(this.taskForm.value.dueDate);

    if (this.isEditMode && this.taskId) {
      const updateData: UpdateTaskRequest = {
        title: this.taskForm.value.title,
        description: this.taskForm.value.description,
        dueDate: dueDate,
        status: this.taskForm.value.status,
        priority: this.taskForm.value.priority,
        categoryId: this.taskForm.value.categoryId || undefined,
      };

      this.taskService.updateTask(this.taskId, updateData).subscribe({
        next: () => this.goBack(),
        error: (error) => console.error('Error updating task:', error),
      });
    } else {
      const createData: CreateTaskRequest = {
        title: this.taskForm.value.title!,
        description: this.taskForm.value.description,
        dueDate: dueDate,
        status: this.taskForm.value.status,
        priority: this.taskForm.value.priority,
        categoryId: this.taskForm.value.categoryId || undefined,
      };

      this.taskService.createTask(createData).subscribe({
        next: () => this.goBack(),
        error: (error) => console.error('Error creating task:', error),
      });
    }
  }

  goBack() {
    this.router.navigate(['/tasks']);
  }

  private formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
