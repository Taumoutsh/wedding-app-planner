import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import {
  CreateWeddingRequest,
  UpdateWeddingRequest,
  CreateUserRequest,
  SetUserAdminRequest,
  WeddingDTO,
  AdminUserDTO,
} from '@wedding-planner/shared';

const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// 16-character password from letters and numbers, using a CSPRNG.
const generatePassword = (length = 16): string => {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)];
  }
  return out;
};

const toAdminUserDTO = (u: {
  id: number;
  username: string;
  isAdmin: boolean;
  weddingId: number | null;
  createdAt: Date;
}): AdminUserDTO => ({
  id: u.id,
  username: u.username,
  isAdmin: u.isAdmin,
  weddingId: u.weddingId,
  createdAt: u.createdAt,
});

// ---- Weddings -------------------------------------------------------------
export const listWeddings = async (_req: AuthRequest, res: Response) => {
  try {
    const weddings = await prisma.wedding.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { users: true, categories: true } } },
    });
    const dto: WeddingDTO[] = weddings.map((w) => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt,
      userCount: w._count.users,
      categoryCount: w._count.categories,
    }));
    res.json(dto);
  } catch (error) {
    console.error('List weddings error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list weddings' });
  }
};

export const createWedding = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body as CreateWeddingRequest;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Bad Request', message: 'Wedding name is required' });
    }
    const wedding = await prisma.wedding.create({ data: { name: name.trim() } });
    res.status(201).json({ id: wedding.id, name: wedding.name, createdAt: wedding.createdAt, userCount: 0, categoryCount: 0 });
  } catch (error) {
    console.error('Create wedding error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create wedding' });
  }
};

export const updateWedding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body as UpdateWeddingRequest;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Bad Request', message: 'Wedding name is required' });
    }
    const wedding = await prisma.wedding.update({
      where: { id: parseInt(id) },
      data: { name: name.trim() },
    });
    res.json({ id: wedding.id, name: wedding.name, createdAt: wedding.createdAt });
  } catch (error) {
    console.error('Update wedding error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update wedding' });
  }
};

export const deleteWedding = async (req: AuthRequest, res: Response) => {
  try {
    const weddingId = parseInt(req.params.id);
    // Remove the accounts tied to this wedding, then the wedding itself (its
    // categories/tasks/subtasks cascade away). The acting admin cannot delete
    // the wedding they are currently working in.
    if (req.user!.weddingId === weddingId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Switch to another wedding before deleting this one',
      });
    }
    await prisma.user.deleteMany({ where: { weddingId } });
    await prisma.wedding.delete({ where: { id: weddingId } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete wedding error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete wedding' });
  }
};

// ---- Users ----------------------------------------------------------------
export const listUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { username: 'asc' } });
    res.json(users.map(toAdminUserDTO));
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list users' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, weddingId } = req.body as CreateUserRequest;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Bad Request', message: 'Username is required' });
    }
    if (!weddingId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Wedding is required' });
    }

    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!wedding) {
      return res.status(400).json({ error: 'Bad Request', message: 'Wedding not found' });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already taken' });
    }

    const password = generatePassword();
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: username.trim(), password: hashed, weddingId, isAdmin: false },
    });

    res.status(201).json({ user: toAdminUserDTO(user), password });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create user' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const password = generatePassword();
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id }, data: { password: hashed } });

    res.json({ user: toAdminUserDTO(user), password });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reset password' });
  }
};

export const setUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isAdmin } = req.body as SetUserAdminRequest;
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'Bad Request', message: 'isAdmin must be a boolean' });
    }
    // Don't let an admin revoke their own admin rights (avoids self lock-out).
    if (id === req.user!.id && !isAdmin) {
      return res.status(400).json({ error: 'Bad Request', message: 'You cannot revoke your own admin rights' });
    }
    const user = await prisma.user.update({ where: { id }, data: { isAdmin } });
    res.json(toAdminUserDTO(user));
  } catch (error) {
    console.error('Set user admin error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Bad Request', message: 'You cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete user' });
  }
};
