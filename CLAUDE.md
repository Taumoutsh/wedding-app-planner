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
  - A date (represents the target/deadline date for the subtask, not creation date)
  - The creator's name (login account)
  - A progress percentage
  - A weight (allowing a weighted average calculation)

#### Subtask Display Rules
- Subtasks are sorted by date: closest deadline first
- Past-due subtasks (date already passed) are displayed at the bottom
- Past-due subtasks are shown with reduced opacity to indicate they are overdue
- Color-coded progress bars indicate completion status (red → orange → yellow → lime → green)

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

## Internationalization (i18n)
- The application supports multiple languages: French (FR) and English (EN)
- **Default language: French**
- Language preference is persisted in localStorage
- A language switcher is available in the bottom-right corner of the application
- Translation files are located in `client/src/i18n/`

### Adding New Translations
When implementing a new feature, always add translations for both languages:

1. **Add the translation key to both language objects** in `client/src/i18n/translations.ts`:
   ```typescript
   en: {
     featureName: {
       label: 'English text',
     }
   },
   fr: {
     featureName: {
       label: 'Texte en français',
     }
   }
   ```

2. **Use the `useTranslation()` hook in components**:
   ```typescript
   import { useTranslation } from '@/i18n/useTranslation';

   export function MyComponent() {
     const { t } = useTranslation();
     return <button>{t('featureName.label')}</button>;
   }
   ```

3. **For dynamic text with variables**, use the variables parameter:
   ```typescript
   const { t } = useTranslation();
   const message = t('dashboard.welcome', { username: user.name });
   // Will replace {username} with the actual value
   ```

### Translation Structure
Translations are organized by component/feature:
- `loginForm` - Login form translations
- `dashboard` - Dashboard and main page translations
- `categoryCard` - Category card UI and dialogs
- `categoryFormModal` - Category creation/edit modal
- `taskCard` - Task card UI and dialogs
- `taskFormModal` - Task creation/edit modal
- `subtaskFormModal` - Subtask creation/edit modal
- `subtaskItem` - Subtask item display and dialogs
- `confirmDialog` - Confirmation dialog translations

## Git Workflow
- **Do NOT automatically commit changes** - Wait for explicit commit requests
- Only commit when explicitly asked to do so
- This allows for review of changes before committing