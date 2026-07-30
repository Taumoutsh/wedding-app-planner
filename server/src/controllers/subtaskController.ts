import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { CreateSubtaskRequest, UpdateSubtaskRequest, SubtaskDTO, ReorderRequest, SetTodoRequest } from '@wedding-planner/shared';
import { taskWeddingId, subtaskWeddingId } from '../utils/scope';

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

    if ((await taskWeddingId(taskId)) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    }

    const maxPosition = await prisma.subtask.aggregate({
      where: { taskId },
      _max: { position: true },
    });
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
        position: (maxPosition._max.position ?? -1) + 1,
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

    if ((await subtaskWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Subtask not found' });
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

    if ((await subtaskWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Subtask not found' });
    }

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

export const setSubtaskTodo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { inTodoList } = req.body as SetTodoRequest;

    if (typeof inTodoList !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'inTodoList must be a boolean',
      });
    }

    if ((await subtaskWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Subtask not found' });
    }

    const subtask = await prisma.subtask.update({
      where: { id: parseInt(id) },
      data: { inTodoList },
    });

    res.json(subtask);
  } catch (error) {
    console.error('Set subtask todo error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update subtask todo state',
    });
  }
};

export const reorderSubtasks = async (req: AuthRequest, res: Response) => {
  try {
    const { orderedIds } = req.body as ReorderRequest;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderedIds must be an array',
      });
    }

    const owned = await prisma.subtask.count({
      where: {
        id: { in: orderedIds },
        task: { category: { weddingId: req.user!.weddingId ?? -1 } },
      },
    });
    if (owned !== orderedIds.length) {
      return res.status(403).json({ error: 'Forbidden', message: 'Cannot reorder these subtasks' });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.subtask.update({ where: { id }, data: { position: index } })
      )
    );

    res.status(204).send();
  } catch (error) {
    console.error('Reorder subtasks error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reorder subtasks',
    });
  }
};
