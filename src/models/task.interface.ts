export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    status: TaskStatus;
    categoryId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum TaskStatus {
    TODO = 'To Do',
    IN_PROGRESS = 'In Progress',
    DONE = 'Done'
  }
  
  export interface TaskFilter {
    status?: TaskStatus;
    dateFrom?: Date;
    dateTo?: Date;
    title?: string;
    categoryId?: string;
  }

  export interface TaskSort {
    field: 'title' | 'dueDate' | 'status' | 'createdAt';
    direction: 'asc' | 'desc';
  }
  