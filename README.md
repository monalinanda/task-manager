# Task Manager

## Getting Started

1. Clone the repository

```bash
git clone git@github.com:monalinanda/task-manager.git
cd task-manager
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200`

## Available Scripts

- `npm start` - Starts the development server
- `npm run build` - Builds the application for production

## Technologies Used

- Angular 20
- RxJS
- Supabase (for backend)
- Lucide Icons
- TypeScript

## Features

- **Task Management**

  - Create, edit, and delete tasks
  - Set task priority (Low, Medium, High)
  - Track task status (Todo, In Progress, Done)
  - Set due dates for tasks
  - Assign categories to task

- **Filtering, Sorting & Searching**

  - Filter tasks by status, priority, and category
  - Search tasks by title
  - Date range filtering
  - Sort tasks by title and status
  - Clear all filters

- **Pagination**

  - Paginated task list view
  - Configurable page size

- **Category Management**

  - Create and edit and delete task categories
  - Assign custom colors to categories
