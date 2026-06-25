import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from '../controllers/taskController';

const router = Router();

router.use(authenticateToken);

router.post('/', createTask);
router.put('/reorder', reorderTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
