import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { CreateTaskRequest, UpdateTaskRequest, TaskDTO } from '@wedding-planner/shared';
import { calculateWeightedAverage, calculateTotalPrice } from '../utils/calculations';

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

    const task = await prisma.task.create({
      data: {
        categoryId,
        title,
        comment: comment || '',
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
