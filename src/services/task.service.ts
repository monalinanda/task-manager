import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  from,
  throwError,
  combineLatest,
} from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilter,
  TaskSort,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../models/task.interface';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private filterSubject = new BehaviorSubject<TaskFilter>({});
  private sortSubject = new BehaviorSubject<TaskSort>({
    field: 'title',
    direction: 'asc',
  });

  tasks$ = this.tasksSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  filter$ = this.filterSubject.asObservable();
  sort$ = this.sortSubject.asObservable();

  filteredAndSortedTasks$ = combineLatest([
    this.tasks$,
    this.filter$,
    this.sort$,
  ]).pipe(
    map(([tasks, filter, sort]) => {
      let filtered = this.applyFilter(tasks, filter);
      // console.log(filtered,"filtered")
      return {
        tasks: this.applySort(filtered, sort),
        //tasks: this.applyFilter(tasks, filter),
      };
    })
  );

  constructor() {
    this.loadTasks();
  }

  private async loadTasks(): Promise<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks: Task[] = data.map(this.mapDatabaseTaskToTask);
      this.tasksSubject.next(tasks);
    } catch (error: any) {
      this.errorSubject.next(error.message);
      console.error('Error loading tasks:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  getAllTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskById(id: string): Observable<Task | undefined> {
    return from(supabase.from('tasks').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseTaskToTask(data);
      })
    );
  }

  createTask(taskData: CreateTaskRequest): Observable<Task> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return from(
      supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          due_date: taskData.dueDate.toISOString().split('T')[0],
          status: taskData.status || TaskStatus.TODO,
          priority: taskData.priority || TaskPriority.MEDIUM,
          category_id: taskData.categoryId || null,
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const newTask = this.mapDatabaseTaskToTask(data);
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([newTask, ...currentTasks]);
        return newTask;
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  updateTask(id: string, updates: UpdateTaskRequest): Observable<Task> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.dueDate !== undefined)
      updateData.due_date = updates.dueDate.toISOString().split('T')[0];
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.categoryId !== undefined)
      updateData.category_id = updates.categoryId;

    return from(
      supabase.from('tasks').update(updateData).eq('id', id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const updatedTask = this.mapDatabaseTaskToTask(data);
        const currentTasks = this.tasksSubject.value;
        const taskIndex = currentTasks.findIndex((task) => task.id === id);
        if (taskIndex !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[taskIndex] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
        return updatedTask;
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  deleteTask(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return from(supabase.from('tasks').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        const currentTasks = this.tasksSubject.value;
        const filteredTasks = currentTasks.filter((task) => task.id !== id);
        this.tasksSubject.next(filteredTasks);
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getTasksByCategory(categoryId: string): Observable<Task[]> {
    return this.tasks$.pipe(
      map((tasks) => tasks.filter((task) => task.categoryId === categoryId))
    );
  }

  setFilter(filter: TaskFilter): void {
    this.filterSubject.next(filter);
  }

  setSort(sort: TaskSort): void {
    this.sortSubject.next(sort);
  }

  private mapDatabaseTaskToTask(dbTask: any): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      dueDate: new Date(dbTask.due_date),
      status: dbTask.status as TaskStatus,
      priority: dbTask.priority as TaskPriority,
      categoryId: dbTask.category_id,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
    };
  }

  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter((task) => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (
        filter.title &&
        !task.title.toLowerCase().includes(filter.title.toLowerCase())
      )
        return false;
      if (filter.categoryId && task.categoryId !== filter.categoryId)
        return false;
      if (filter.dateFrom && task.dueDate < filter.dateFrom) return false;
      if (filter.dateTo && task.dueDate > filter.dateTo) return false;
      return true;
    });
  }

  private applySort(tasks: Task[], sort: TaskSort): Task[] {
    return [...tasks].sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
