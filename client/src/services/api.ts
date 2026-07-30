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
  UserDTO,
  WeddingDTO,
  AdminUserDTO,
  UserWithPasswordDTO,
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

// When the token is missing/expired/invalid the server replies 401/403.
// Clear the stale session and notify the app so it returns to the login
// screen instead of rendering an empty dashboard.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  me: () => api.get<UserDTO>('/auth/me'),
};

export const adminApi = {
  listWeddings: () => api.get<WeddingDTO[]>('/admin/weddings'),
  createWedding: (name: string) => api.post<WeddingDTO>('/admin/weddings', { name }),
  renameWedding: (id: number, name: string) => api.put<WeddingDTO>(`/admin/weddings/${id}`, { name }),
  deleteWedding: (id: number) => api.delete(`/admin/weddings/${id}`),

  listUsers: () => api.get<AdminUserDTO[]>('/admin/users'),
  createUser: (username: string, weddingId: number) =>
    api.post<UserWithPasswordDTO>('/admin/users', { username, weddingId }),
  resetPassword: (id: number) => api.put<UserWithPasswordDTO>(`/admin/users/${id}/password`),
  setUserAdmin: (id: number, isAdmin: boolean) =>
    api.put<AdminUserDTO>(`/admin/users/${id}/admin`, { isAdmin }),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
};

export const categoryApi = {
  getAll: () => api.get<CategoryDTO[]>('/categories'),
  create: (data: CreateCategoryRequest) => api.post<CategoryDTO>('/categories', data),
  update: (id: number, data: UpdateCategoryRequest) =>
    api.put<CategoryDTO>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
  reorder: (orderedIds: number[]) => api.put('/categories/reorder', { orderedIds }),
};

export const taskApi = {
  create: (data: CreateTaskRequest) => api.post<TaskDTO>('/tasks', data),
  update: (id: number, data: UpdateTaskRequest) =>
    api.put<TaskDTO>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  reorder: (orderedIds: number[]) => api.put('/tasks/reorder', { orderedIds }),
};

export const subtaskApi = {
  create: (data: CreateSubtaskRequest) => api.post<SubtaskDTO>('/subtasks', data),
  update: (id: number, data: UpdateSubtaskRequest) =>
    api.put<SubtaskDTO>(`/subtasks/${id}`, data),
  delete: (id: number) => api.delete(`/subtasks/${id}`),
  reorder: (orderedIds: number[]) => api.put('/subtasks/reorder', { orderedIds }),
  setTodo: (id: number, inTodoList: boolean) =>
    api.put<SubtaskDTO>(`/subtasks/${id}/todo`, { inTodoList }),
};

export default api;
