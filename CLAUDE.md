# Wedding Planning Web Application - Specifications

## Overview
Create a web application for organizing a wedding.

## Authentication & Security
- This application will be accessible through a login and password
- The password must be encrypted in the database
- No account creation possible

## Technical Requirements
- Use standard HTTP requests for data transmission
- Data will be saved in a database

## Core Features

### Main Tasks
- The application will allow the creation of main tasks (caterer, venue rental, car rental, ...)
- These tasks will be created by users
- These main tasks will be classified into categories

### Categories
- Categories will be created by users
- A category contains:
  - A name
  - The weighted average percentage of all subtasks of the main tasks that compose it

### Tasks
- Each main task can contain one or more subtasks
- A task contains:
  - A title
  - A comment
  - The weighted average of all associated subtasks

### Subtasks
- A subtask contains:
  - A title
  - A comment
  - A date
  - The creator's name (login account)
  - A progress percentage
  - A weight (allowing a weighted average calculation)

## Progress Tracking
The overall progress of the wedding will be represented by the weighted average of all entered subtasks.

## CRUD Operations
- Categories, tasks, and subtasks can be created, added, or deleted
- When deleting, all child elements are also deleted (add a confirmation popup)

## Responsive Design
The application must be usable on mobile and computer.

## UI Layout

### Structure
Categories take up the full width of the screen. For a category, each task is represented in a tile. Inside this tile, each subtask is found in list format, with all associated information.

### Example Layout:
```
Categories

Task 1 Title
Task 1 Comment

Subtask 1 Title                  Subtask 1 username
subtask 1 comment   Subtask 1 percentage   Subtask weight
```

## Editing Interface
- The editing of each category, task, and subtask is done in a popup
- Each element is editable, except for:
  - The modification date (calculated automatically by the application)
  - The user's name (calculated automatically by the application)
  - The average calculations for categories and main tasks (calculated automatically)