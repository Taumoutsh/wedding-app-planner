# Wedding Planning Web Application - Specifications

## Overview
Create a web application for organizing a wedding.

## Authentication & Security
- This application will be accessible through a login and password
- The password must be encrypted in the database
- No account creation possible
- Auth uses a JWT (30-day expiry) stored in localStorage
- Session expiry handling: when any API request returns 401/403 (expired or
  invalid token), the axios response interceptor in `client/src/services/api.ts`
  clears the stored session and dispatches an `auth:unauthorized` event.
  `AuthContext` listens for this event and resets auth state, returning the user
  to the login screen instead of showing an empty dashboard.

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
- Subtasks are displayed in a user-defined manual order (see Ordering & Drag-and-Drop)
- Past-due subtasks (date already passed) are shown with reduced opacity to indicate they are overdue
- Color-coded progress bars indicate completion status (red → orange → yellow → lime → green)

## Ordering & Drag-and-Drop
- Categories, tasks, and subtasks each have an integer `position` column and are
  always returned/sorted by `position` ascending (newly created items go to the end)
- Users reorder any level by drag-and-drop, using a grip handle on each card
  (built with `@dnd-kit`; see `client/src/components/SortableList.tsx`)
- On drop the client reorders optimistically and persists the new order via a
  reorder endpoint: `PUT /api/categories/reorder`, `PUT /api/tasks/reorder`,
  `PUT /api/subtasks/reorder`, each taking `{ orderedIds: number[] }`
- Subtasks are NOT auto-sorted by deadline (manual order takes precedence)

## Progress Tracking
The overall progress of the wedding will be represented by the weighted average of all entered subtasks.

## Data Export
- An "Export" button in the dashboard header generates an Excel (.xlsx) workbook
  from the currently loaded data (client-side, no extra API call)
- Implemented in `client/src/utils/exportToExcel.ts` using `exceljs`, which is
  lazy-loaded via dynamic `import()` so it stays out of the initial bundle
- **Detail sheet**: hierarchical listing (Category → Task → Subtask) with each
  subtask's comment, deadline, creator, progress, weight, price, include toggle,
  and link. Prices are summed at three levels: a subtotal per task
  ("subcategory"), a total per category, and a grand total at the bottom
- **Fold/unfold**: rows use Excel outline grouping (`outlineLevel` 0/1/2 with
  `outlineProperties.summaryBelow = false`) so categories and tasks collapse via
  the gutter +/- buttons. Secondary columns (comment, deadline, assignee, weight,
  link) are grouped at column `outlineLevel` 1 so they hide/show with one click;
  the header row also has an auto-filter
- **Include toggles**: each subtask has an "Include" cell (✓/✗ dropdown, default
  ✓) backed by data validation. All price totals — task subtotals, category
  totals, grand total, and the Summary sheet prices — are live `SUMIF` formulas
  keyed on the ✓ flag, so excluding a spending recalculates every total in Excel.
  (Progress figures stay static; only spendings react to the toggle. The embedded
  charts are images and do not react.) Real form-control checkbox widgets aren't
  emitted because ExcelJS cannot create them
- **Summary sheet**: one row per category (task count, subtask count, average
  progress, total price) plus a grand-total row, and two embedded bar charts
  (budget by category, average progress by category) rendered to canvas images.
  Category/grand prices are cross-sheet formulas referencing the Detail totals
- Sheet labels and headers are localized via the i18n `export` namespace; the
  button is hidden when there are no categories

## Subtask Search
- A sticky search bar sits in the dashboard header, above the category list
  (`client/src/components/SubtaskSearch.tsx`)
- It filters the already-loaded subtasks by **title** as the user types
  (case- and accent-insensitive; no extra API call) and shows matches in a
  combobox dropdown, each row showing the subtask title and its
  `Category › Task` breadcrumb. Arrow keys + Enter navigate; Escape/outside
  click closes
- Selecting a result calls `navigateToSubtask` on a small `NavigationContext`
  (`client/src/contexts/NavigationContext.tsx`), which holds a target
  `{ categoryId, taskId, subtaskId, nonce }`. The `nonce` makes re-selecting the
  same subtask re-trigger the effects
- On navigation the matching `CategoryCard` and `TaskCard` force-expand (and
  persist their expanded cookie) and the matching `SubtaskItem` scrolls into
  view with a brief highlight ring
- Strings localized via the i18n `search` namespace

## View Modes (Remaining & Todo list)
Two header controls (shown above the search bar when there is at least one
category) switch what the dashboard shows:

### Remaining only
- A toggle in the header. When on, everything already at 100% is hidden:
  completed subtasks (even inside a still-incomplete task), tasks whose average
  is 100%, and fully-complete categories. Filtering happens in `Dashboard` via
  `visibleCategories` (a filtered deep copy of the loaded data)
- The toggle state is persisted in `localStorage` under `remainingOnly`
- Drag-and-drop is disabled while filtering (reordering a filtered subset would
  corrupt `position`s): `CategoryCard`/`TaskCard` take a `sortable` prop and
  render plain lists (no `SortableList`, no drag handle) when it is `false`
- When nothing remains, a celebratory "all done" message is shown

### Todo list
- Each subtask has a toggle button (next to Edit) that adds/removes it from a
  shared todo list, backed by an `inTodoList` boolean column on `Subtask`
  (migration `add_todo_list_flag`). The flag is global (same for every login and
  device), toggled via `PUT /api/subtasks/:id/todo` with `{ inTodoList: boolean }`
  (`subtaskApi.setTodo`)
- A "Todo list" header button opens `TodoListView` (a separate view, with a
  "Back" control) listing only flagged subtasks as a checklist — no comments,
  sorted by deadline (soonest first, undated last), each row showing the
  `Category › Task` breadcrumb, deadline, and progress
- Checking an item off removes it from the list (sets `inTodoList` false); it
  does not change the subtask's progress
- Strings localized via the i18n `dashboard`, `subtaskItem`, and `todo` namespaces

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
- `search` - Subtask search field placeholder and dropdown labels
- `todo` - Todo list view title, empty state, and check action
- `export` - Excel export button, sheet names, column headers, and chart titles
- `common` - Shared labels (e.g. drag-to-reorder handle)

## Git Workflow
- **Do NOT automatically commit changes** - Wait for explicit commit requests
- Only commit when explicitly asked to do so
- This allows for review of changes before committing
