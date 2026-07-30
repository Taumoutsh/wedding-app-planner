export interface Wedding {
  id: number;
  name: string;
  createdAt: Date;
}

export interface User {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
  weddingId: number | null;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  weddingId: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  averageProgress?: number;
  totalPrice?: number;
}

export interface Task {
  id: number;
  categoryId: number;
  title: string;
  comment: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  averageProgress?: number;
  totalPrice?: number;
}

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  comment: string;
  date: Date | null;
  createdBy: string;
  progressPercentage: number;
  weight: number;
  price?: number | null;
  link?: string | null;
  urgent: boolean;
  important: boolean;
  inTodoList: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs (Data Transfer Objects) - without sensitive data
export interface UserDTO {
  id: number;
  username: string;
  isAdmin: boolean;
  weddingId: number | null;
  weddingName: string | null;
}

export interface WeddingDTO {
  id: number;
  name: string;
  createdAt: Date;
  userCount: number;
  categoryCount: number;
}

// A user account as listed in the admin page (no password hash).
export interface AdminUserDTO {
  id: number;
  username: string;
  isAdmin: boolean;
  weddingId: number | null;
  createdAt: Date;
}

export interface CategoryDTO extends Omit<Category, 'averageProgress' | 'totalPrice'> {
  averageProgress: number;
  totalPrice: number;
  tasks?: TaskDTO[];
}

export interface TaskDTO extends Omit<Task, 'averageProgress' | 'totalPrice'> {
  averageProgress: number;
  totalPrice: number;
  subtasks?: SubtaskDTO[];
}

export interface SubtaskDTO extends Subtask {}

// Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserDTO;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface CreateTaskRequest {
  categoryId: number;
  title: string;
  comment: string;
}

export interface UpdateTaskRequest {
  title: string;
  comment: string;
}

export interface CreateSubtaskRequest {
  taskId: number;
  title: string;
  comment: string;
  date: Date | null;
  progressPercentage: number;
  weight: number;
  price?: number | null;
  link?: string | null;
  urgent: boolean;
  important: boolean;
}

export interface UpdateSubtaskRequest {
  title: string;
  comment: string;
  date: Date | null;
  progressPercentage: number;
  weight: number;
  price?: number | null;
  link?: string | null;
  urgent: boolean;
  important: boolean;
}

export interface ReorderRequest {
  orderedIds: number[];
}

export interface SetTodoRequest {
  inTodoList: boolean;
}

// ---- Admin ----------------------------------------------------------------
export interface CreateWeddingRequest {
  name: string;
}

export interface UpdateWeddingRequest {
  name: string;
}

export interface CreateUserRequest {
  username: string;
  weddingId: number;
}

export interface SetUserAdminRequest {
  isAdmin: boolean;
}

// Returned when an account is created or its password reset — carries the
// generated plaintext password once so the admin can hand it over.
export interface UserWithPasswordDTO {
  user: AdminUserDTO;
  password: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
