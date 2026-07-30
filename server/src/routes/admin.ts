import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  listWeddings,
  createWedding,
  updateWedding,
  deleteWedding,
  listUsers,
  createUser,
  resetPassword,
  setUserAdmin,
  deleteUser,
} from '../controllers/adminController';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/weddings', listWeddings);
router.post('/weddings', createWedding);
router.put('/weddings/:id', updateWedding);
router.delete('/weddings/:id', deleteWedding);

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id/password', resetPassword);
router.put('/users/:id/admin', setUserAdmin);
router.delete('/users/:id', deleteUser);

export default router;
