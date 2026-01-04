import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { CreateSubtaskRequest, UpdateSubtaskRequest, SubtaskDTO } from '@wedding-planner/shared';

export const createSubtask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, title, comment, date, progressPercentage, weight, price, link, urgent, important } =
      req.body as CreateSubtaskRequest;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Subtask title is required',
      });
    }

    if (!taskId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Task ID is required',
      });
    }

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title,
        comment: comment || '',
        date: date ? new Date(date) : null,
        createdBy: req.user!.username,
        progressPercentage: progressPercentage || 0,
        weight: weight || 1,
        price: price || null,
        link: link || null,
        urgent: urgent || false,
        important: important || false,
      },
    });

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create subtask',
    });
  }
};

export const updateSubtask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, comment, date, progressPercentage, weight, price, link, urgent, important } =
      req.body as UpdateSubtaskRequest;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Subtask title is required',
      });
    }

    const subtask = await prisma.subtask.update({
      where: { id: parseInt(id) },
      data: {
        title,
        comment: comment || '',
        date: date ? new Date(date) : null,
        progressPercentage,
        weight,
        price: price || null,
        link: link || null,
        urgent,
        important,
      },
    });

    res.json(subtask);
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update subtask',
    });
  }
};

export const deleteSubtask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.subtask.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete subtask',
    });
  }
};
