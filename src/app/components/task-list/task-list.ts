import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss'
})
export class TaskList {
  constructor(
    private router : Router ,
  ){}

  navigateToCreateTask() {
    this.router.navigate(['/tasks/new']);
  }
}
