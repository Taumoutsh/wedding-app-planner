import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks,
  setSubtaskTodo,
} from '../controllers/subtaskController';

const router = Router();

router.use(authenticateToken);

router.post('/', createSubtask);
router.put('/reorder', reorderSubtasks);
router.put('/:id/todo', setSubtaskTodo);
router.put('/:id', updateSubtask);
router.delete('/:id', deleteSubtask);

export default router;
