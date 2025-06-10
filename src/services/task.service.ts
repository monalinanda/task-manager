import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  from,
  throwError,
  combineLatest,
  switchMap,
  Subject,
  defer,
} from 'rxjs';
import {
  map,
  catchError,
  tap,
  startWith,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilter,
  TaskSort,
  CreateTaskRequest,
  UpdateTaskRequest,
  PaginationParams,
  PaginatedResponse,
} from '../models/task.interface';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private filterSubject = new BehaviorSubject<TaskFilter>({});
  private sortSubject = new BehaviorSubject<TaskSort>({
    field: 'title',
    direction: 'asc',
  });
  private paginationSubject = new BehaviorSubject<PaginationParams>({
    page: 1,
    pageSize: 10,
  });
  private searchSubject = new Subject<string>();

  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  filter$ = this.filterSubject.asObservable();
  sort$ = this.sortSubject.asObservable();
  pagination$ = this.paginationSubject.asObservable();

  // Debounced search
  private debouncedSearch$ = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap((searchTerm) => {
      const currentFilter = this.filterSubject.value;
      this.filterSubject.next({
        ...currentFilter,
        title: searchTerm,
      });
    })
  );

  tasks$ = combineLatest([this.filter$, this.sort$, this.pagination$]).pipe(
    switchMap(([filter, sort, pagination]) =>
      this.loadTasks(filter, sort, pagination)
    )
  );

  constructor() {
    this.debouncedSearch$.subscribe();
  }

  private loadTasks(
    filter: TaskFilter,
    sort: TaskSort,
    pagination: PaginationParams
  ): Observable<PaginatedResponse<Task>> {
    return defer(async () => {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      try {
        const from = (pagination.page - 1) * pagination.pageSize;
        const to = from + pagination.pageSize - 1;

        let query = supabase.from('tasks').select('*', { count: 'exact' });

        // Apply filters
        if (filter.status) {
          query = query.eq('status', filter.status);
        }
        if (filter.priority) {
          query = query.eq('priority', filter.priority);
        }
        if (filter.categoryId) {
          query = query.eq('category_id', filter.categoryId);
        }
        if (filter.title) {
          query = query.ilike('title', `%${filter.title}%`);
        }
        if (filter.dateFrom) {
          query = query.gte(
            'due_date',
            filter.dateFrom.toISOString().split('T')[0]
          );
        }
        if (filter.dateTo) {
          query = query.lte(
            'due_date',
            filter.dateTo.toISOString().split('T')[0]
          );
        }

        // sorting
        query = query.order(sort.field, {
          ascending: sort.direction === 'asc',
        });

        // pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;
        if (count === null) throw new Error('Could not get count');

        const totalPages = Math.ceil(count / pagination.pageSize);

        return {
          data: data.map(this.mapDatabaseTaskToTask),
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        this.errorSubject.next(errorMessage);
        console.error('Error loading tasks:', error);
        throw error;
      } finally {
        this.loadingSubject.next(false);
      }
    });
  }

  getAllTasks(): Observable<PaginatedResponse<Task>> {
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
        return this.mapDatabaseTaskToTask(data);
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
        return this.mapDatabaseTaskToTask(data);
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
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => {
        this.loadingSubject.next(false);
        this.filterSubject.next({ ...this.filterSubject.value });
      })
    );
  }

  getTasksByCategory(categoryId: string): Observable<Task[]> {
    return from(
      supabase.from('tasks').select('*').eq('category_id', categoryId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(this.mapDatabaseTaskToTask);
      })
    );
  }

  setFilter(filter: TaskFilter): void {
    this.filterSubject.next(filter);
  }

  setSort(sort: TaskSort): void {
    this.sortSubject.next(sort);
  }

  setPagination(params: PaginationParams): void {
    this.paginationSubject.next(params);
  }

  setSearch(term: string): void {
    this.searchSubject.next(term);
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
}
