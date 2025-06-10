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
  Category,
  CategoryFilter,
  CategorySort,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../models/category.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private filterSubject = new BehaviorSubject<CategoryFilter>({});
  private sortSubject = new BehaviorSubject<CategorySort>({
    field: 'title',
    direction: 'asc',
  });
  private pageSubject = new BehaviorSubject<{ page: number; size: number }>({
    page: 1,
    size: 6,
  });

  categories$ = this.categoriesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  filter$ = this.filterSubject.asObservable();
  sort$ = this.sortSubject.asObservable();
  page$ = this.pageSubject.asObservable();

  filteredAndSortedCategories$ = combineLatest([
    this.categories$,
    this.filter$,
    this.sort$,
  ]).pipe(
    map(([categories, filter, sort]) => {
      let filtered = this.applyFilter(categories, filter);
      return {
        categories: this.applySort(filtered, sort),
      };
    })
  );

  // paginatedCategories$ = combineLatest([
  //   this.filteredAndSortedCategories$,
  //   this.page$,
  // ]).pipe(
  //   map(([categories, pagination]) => {
  //     const startIndex = (pagination.page - 1) * pagination.size;
  //     const endIndex = startIndex + pagination.size;
  //     return {
  //       categories: categories.slice(startIndex, endIndex),
  //       totalCategories: categories.length,
  //       totalPages: Math.ceil(categories.length / pagination.size),
  //       currentPage: pagination.page,
  //     };
  //   })
  // );

  constructor() {
    // Load categories on service initialization
    this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;

      const categories: Category[] = data.map(
        this.mapDatabaseCategoryToCategory
      );
      this.categoriesSubject.next(categories);
    } catch (error: any) {
      this.errorSubject.next(error.message);
      console.error('Error loading categories:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  getAllCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoryById(id: string): Observable<Category | undefined> {
    return this.categories$.pipe(
      map((categories) => categories.find((category) => category.id === id))
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
        const newCategory = this.mapDatabaseCategoryToCategory(data);
        const currentCategories = this.categoriesSubject.value;
        this.categoriesSubject.next([...currentCategories, newCategory]);
        return newCategory;
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
        const updatedCategory = this.mapDatabaseCategoryToCategory(data);
        const currentCategories = this.categoriesSubject.value;
        const categoryIndex = currentCategories.findIndex(
          (category) => category.id === id
        );
        if (categoryIndex !== -1) {
          const updatedCategories = [...currentCategories];
          updatedCategories[categoryIndex] = updatedCategory;
          this.categoriesSubject.next(updatedCategories);
        }
        return updatedCategory;
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  deleteCategory(id: string): Observable<void> {
    console.log(id);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    return from(supabase.from('categories').delete().eq('id', id)).pipe(
      map(({ error }) => {
        console.log(error);
        if (error) throw error;
        const currentCategories = this.categoriesSubject.value;
        const filteredCategories = currentCategories.filter(
          (category) => category.id !== id
        );
        this.categoriesSubject.next(filteredCategories);
        console.log(this.categoriesSubject, ' this.categoriesSubject');
      }),
      catchError((error) => {
        this.errorSubject.next(error.message);
        return throwError(() => error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // deleteCategory(id: string): void {
  //   const currentCategories = this.categoriesSubject.value;
  //   const filteredCategories = currentCategories.filter(
  //     (category) => category.id !== id
  //   );
  //   this.categoriesSubject.next(filteredCategories);
  // }

  setFilter(filter: CategoryFilter): void {
    this.filterSubject.next(filter);
    this.pageSubject.next({ ...this.pageSubject.value, page: 1 });
  }

  setSort(sort: CategorySort): void {
    this.sortSubject.next(sort);
  }

  setPage(page: number): void {
    this.pageSubject.next({ ...this.pageSubject.value, page });
  }

  private mapDatabaseCategoryToCategory(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      title: dbCategory.title,
      description: dbCategory.description || '',
      color: dbCategory.color,
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at),
    };
  }

  private applyFilter(
    categories: Category[],
    filter: CategoryFilter
  ): Category[] {
    return categories.filter((category) => {
      if (
        filter.title &&
        !category.title.toLowerCase().includes(filter.title.toLowerCase())
      )
        return false;
      return true;
    });
  }

  private applySort(categories: Category[], sort: CategorySort): Category[] {
    return [...categories].sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      if (sort.field === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
