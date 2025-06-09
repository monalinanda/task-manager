export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  dateFrom?: Date;
  dateTo?: Date;
  title?: string;
  categoryId?: string;
}

export interface TaskSort {
  field: 'title' | 'dueDate' | 'status' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate: Date;
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
}
