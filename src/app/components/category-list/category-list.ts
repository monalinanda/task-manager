import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-list',
  imports: [],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryList {
 constructor(
  private router: Router
 ){}
 
 navigateToCreateCategory() {
 this.router.navigate(['/categories/new']);
 }
}
