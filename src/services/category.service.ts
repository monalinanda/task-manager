import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  from,
  throwError,
  combineLatest,
  defer,
  shareReplay,
  Subject,
} from 'rxjs';
import {
  map,
  catchError,
  tap,
  switchMap,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import {
  Category,
  CategoryFilter,
  CategorySort,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginationParams,
  PaginatedResponse,
} from '../models/category.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private filterSubject = new BehaviorSubject<CategoryFilter>({});
  private sortSubject = new BehaviorSubject<CategorySort>({
    field: 'title',
    direction: 'asc',
  });
  private paginationSubject = new BehaviorSubject<PaginationParams>({
    page: 1,
    pageSize: 10,
  });
  private searchSubject = new Subject<string>();

  // Add a cached categories observable
  private allCategories$ = defer(() =>
    from(
      supabase
        .from('categories')
        .select('*')
        .order('title', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(this.mapDatabaseCategoryToCategory);
      }),
      shareReplay(1) // Cache the result
    )
  );

  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  filter$ = this.filterSubject.asObservable().pipe(distinctUntilChanged());
  sort$ = this.sortSubject.asObservable().pipe(distinctUntilChanged());
  pagination$ = this.paginationSubject
    .asObservable()
    .pipe(distinctUntilChanged());

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

  // Combined stream for categories with pagination
  categories$ = combineLatest([
    this.filter$,
    this.sort$,
    this.pagination$,
  ]).pipe(
    switchMap(([filter, sort, pagination]) =>
      this.loadCategories(filter, sort, pagination)
    )
  );

  constructor() {
    // Subscribe to debounced search
    this.debouncedSearch$.subscribe();
  }

  getAllCategories(): Observable<Category[]> {
    return this.allCategories$;
  }

  setSearch(term: string): void {
    this.searchSubject.next(term);
  }

  private loadCategories(
    filter: CategoryFilter,
    sort: CategorySort,
    pagination: PaginationParams
  ): Observable<PaginatedResponse<Category>> {
    return defer(async () => {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      try {
        // Calculate range for pagination
        const from = (pagination.page - 1) * pagination.pageSize;
        const to = from + pagination.pageSize - 1;

        // Start building the query
        let query = supabase.from('categories').select(
          `
            *,
            tasks (
              id,
              title,
              status,
              due_date,
              priority
            )
          `,
          { count: 'exact' }
        );

        // Apply filters
        if (filter.title) {
          query = query.ilike('title', `%${filter.title}%`);
        }

        // Apply sorting
        const sortField =
          sort.field === 'createdAt' ? 'created_at' : sort.field;
        query = query.order(sortField, {
          ascending: sort.direction === 'asc',
        });

        // Apply pagination
        query = query.range(from, to);

        // Execute query
        const { data, error, count } = await query;

        if (error) throw error;
        if (count === null) throw new Error('Could not get count');

        const totalPages = Math.ceil(count / pagination.pageSize);

        return {
          data: data.map(this.mapDatabaseCategoryToCategory),
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        this.errorSubject.next(errorMessage);
        console.error('Error loading categories:', error);
        throw error;
      } finally {
        this.loadingSubject.next(false);
      }
    });
  }

  getCategoryById(id: string): Observable<Category | undefined> {
    return from(
      supabase.from('categories').select('*').eq('id', id).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.mapDatabaseCategoryToCategory(data) : undefined;
      })
    );
  }

  createCategory(categoryData: CreateCategoryRequest): Observable<Category> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return from(
      supabase
        .from('categories')
        .insert({
          title: categoryData.title,
          description: categoryData.description || '',
          color: categoryData.color || '#2563eb',
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseCategoryToCategory(data);
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  updateCategory(
    id: string,
    updates: UpdateCategoryRequest
  ): Observable<Category> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.color !== undefined) updateData.color = updates.color;

    return from(
      supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseCategoryToCategory(data);
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  deleteCategory(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return from(supabase.from('categories').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  setFilter(filter: CategoryFilter): void {
    this.filterSubject.next(filter);
  }

  setSort(sort: CategorySort): void {
    this.sortSubject.next(sort);
  }

  setPagination(params: PaginationParams): void {
    this.paginationSubject.next(params);
  }

  private mapDatabaseCategoryToCategory(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      title: dbCategory.title,
      description: dbCategory.description || '',
      color: dbCategory.color,
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at),
      tasks: (dbCategory.tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: new Date(task.due_date),
        priority: task.priority,
      })),
    };
  }
}
