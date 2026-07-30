import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';
import { LoginRequest, LoginResponse, UserDTO } from '@wedding-planner/shared';
import { AuthRequest } from '../middleware/auth';

const toUserDTO = (user: {
  id: number;
  username: string;
  isAdmin: boolean;
  weddingId: number | null;
  wedding?: { name: string } | null;
}): UserDTO => ({
  id: user.id,
  username: user.username,
  isAdmin: user.isAdmin,
  weddingId: user.weddingId,
  weddingName: user.wedding?.name ?? null,
});

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { wedding: true },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    const response: LoginResponse = {
      token,
      user: toUserDTO(user),
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    });
  }
};

// Returns the current user (fresh isAdmin/wedding), e.g. after an admin
// switches their active wedding.
export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { wedding: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User no longer exists' });
    }

    res.json(toUserDTO(user));
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load user' });
  }
};
