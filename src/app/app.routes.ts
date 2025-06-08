import { Routes } from '@angular/router';
import { CategoryForm } from './components/category-form/category-form';
import { CategoryList } from './components/category-list/category-list';
import { TaskList } from './components/task-list/task-list';
import { TaskForm } from './components/task-form/task-form';

export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: 'tasks', component: TaskList },
  { path: 'tasks/new', component: TaskForm },
  { path: 'tasks/:id/edit', component: TaskForm },
  { path: 'categories', component: CategoryList },
  { path: 'categories/new', component: CategoryForm },
  { path: 'categories/:id/edit', component: CategoryForm },
  { path: '**', redirectTo: '/tasks' },
];
