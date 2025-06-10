import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../models/category.interface';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-category-form',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm {
  categoryForm!: FormGroup;

  isEditMode = false;
  categoryId?: string;

  colorPresets = [
    '#2563eb',
    '#7c3aed',
    '#059669',
    '#ea580c',
    '#dc2626',
    '#0891b2',
    '#7c2d12',
    '#374151',
  ];

  constructor(
    public categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.categoryForm = this.fb.group({
      title: '',
      description: '',
      color: '#2563eb',
    });

    this.categoryId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.categoryId;

    if (this.isEditMode && this.categoryId) {
      this.categoryService
        .getCategoryById(this.categoryId)
        .subscribe((category) => {
          if (category) {
            this.categoryForm.patchValue(category);
          }
        });
    }
  }

  onSubmit() {
    if (!this.categoryForm.invalid) {
      console.log('errorrrr');
    }

    if (this.isEditMode && this.categoryId) {
      const updateData: UpdateCategoryRequest = {
        title: this.categoryForm.value.title,
        description: this.categoryForm.value.description,
        color: this.categoryForm.value.color || '#2563eb',
      };

      this.categoryService
        .updateCategory(this.categoryId, updateData)
        .subscribe({
          next: () => this.goBack(),
          error: (error) => console.error('Error updating category:', error),
        });
    } else {
      const createData: CreateCategoryRequest = {
        title: this.categoryForm.value.title!,
        description: this.categoryForm.value.description,
        color: this.categoryForm.value.color || '#2563eb',
      };

      this.categoryService.createCategory(createData).subscribe({
        next: () => this.goBack(),
        error: (error) => console.error('Error creating category:', error),
      });
    }
    console.log('Form submitted');
  }

  selectColor(color: string) {
    this.categoryForm.patchValue({ color: color });
    console.log(`Color selected: ${color}`);
  }

  goBack() {
    this.router.navigate(['/categories']);
    console.log('Navigating back to category list');
  }
}
