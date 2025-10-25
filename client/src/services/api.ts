import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  CategoryDTO,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
  TaskDTO,
  SubtaskDTO,
} from '@wedding-planner/shared';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
};

export const categoryApi = {
  getAll: () => api.get<CategoryDTO[]>('/categories'),
  create: (data: CreateCategoryRequest) => api.post<CategoryDTO>('/categories', data),
  update: (id: number, data: UpdateCategoryRequest) =>
    api.put<CategoryDTO>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const taskApi = {
  create: (data: CreateTaskRequest) => api.post<TaskDTO>('/tasks', data),
  update: (id: number, data: UpdateTaskRequest) =>
    api.put<TaskDTO>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export const subtaskApi = {
  create: (data: CreateSubtaskRequest) => api.post<SubtaskDTO>('/subtasks', data),
  update: (id: number, data: UpdateSubtaskRequest) =>
    api.put<SubtaskDTO>(`/subtasks/${id}`, data),
  delete: (id: number) => api.delete(`/subtasks/${id}`),
};

export default api;
