import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { CreateTaskRequest, UpdateTaskRequest, TaskDTO, ReorderRequest } from '@wedding-planner/shared';
import { calculateWeightedAverage, calculateTotalPrice } from '../utils/calculations';
import { categoryWeddingId, taskWeddingId } from '../utils/scope';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, title, comment } = req.body as CreateTaskRequest;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Task title is required',
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID is required',
      });
    }

    if ((await categoryWeddingId(categoryId)) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Category not found' });
    }

    const maxPosition = await prisma.task.aggregate({
      where: { categoryId },
      _max: { position: true },
    });
    const task = await prisma.task.create({
      data: {
        categoryId,
        title,
        comment: comment || '',
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: {
        subtasks: true,
      },
    });

    const taskWithProgress: TaskDTO = {
      ...task,
      averageProgress: 0,
      totalPrice: 0,
      subtasks: [],
    };

    res.status(201).json(taskWithProgress);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create task',
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, comment } = req.body as UpdateTaskRequest;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Task title is required',
      });
    }

    if ((await taskWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title,
        comment: comment || '',
      },
      include: {
        subtasks: true,
      },
    });

    const taskWithProgress: TaskDTO = {
      ...task,
      averageProgress: calculateWeightedAverage(task.subtasks),
      totalPrice: calculateTotalPrice(task.subtasks),
      subtasks: task.subtasks,
    };

    res.json(taskWithProgress);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update task',
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if ((await taskWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete task',
    });
  }
};

export const reorderTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { orderedIds } = req.body as ReorderRequest;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderedIds must be an array',
      });
    }

    const owned = await prisma.task.count({
      where: { id: { in: orderedIds }, category: { weddingId: req.user!.weddingId ?? -1 } },
    });
    if (owned !== orderedIds.length) {
      return res.status(403).json({ error: 'Forbidden', message: 'Cannot reorder these tasks' });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.task.update({ where: { id }, data: { position: index } })
      )
    );

    res.status(204).send();
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reorder tasks',
    });
  }
};
