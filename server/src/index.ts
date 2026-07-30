import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import taskRoutes from './routes/tasks';
import subtaskRoutes from './routes/subtasks';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Serve static files from client build
const clientBuildPath = path.join(__dirname, '../../client/dist');
console.log(`Serving static files from: ${clientBuildPath}`);
app.use(express.static(clientBuildPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be before SPA fallback)
app.use(errorHandler);

// Serve index.html for all non-API routes (SPA fallback)
// This must be last so it catches all remaining requests
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://192.168.1.23:${PORT}`);
});
