export interface User {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
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
  createdAt: Date;
  updatedAt: Date;
}

// DTOs (Data Transfer Objects) - without sensitive data
export interface UserDTO {
  id: number;
  username: string;
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
}

export interface UpdateSubtaskRequest {
  title: string;
  comment: string;
  date: Date | null;
  progressPercentage: number;
  weight: number;
  price?: number | null;
  link?: string | null;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
