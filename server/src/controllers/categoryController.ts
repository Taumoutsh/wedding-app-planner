import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { CreateCategoryRequest, UpdateCategoryRequest, CategoryDTO, ReorderRequest } from '@wedding-planner/shared';
import { calculateWeightedAverage, calculateTotalPrice } from '../utils/calculations';
import { categoryWeddingId } from '../utils/scope';

export const getAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    // Only the logged-in user's wedding. An admin with no active wedding sees none.
    if (req.user!.weddingId == null) {
      return res.json([]);
    }

    const categories = await prisma.category.findMany({
      where: { weddingId: req.user!.weddingId },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            subtasks: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    const categoriesWithProgress: CategoryDTO[] = categories.map((category) => {
      const allSubtasks = category.tasks.flatMap((task) => task.subtasks);
      const averageProgress = calculateWeightedAverage(allSubtasks);
      const totalPrice = calculateTotalPrice(allSubtasks);

      const tasks = category.tasks.map((task) => ({
        ...task,
        averageProgress: calculateWeightedAverage(task.subtasks),
        totalPrice: calculateTotalPrice(task.subtasks),
        subtasks: task.subtasks,
      }));

      return {
        ...category,
        averageProgress,
        totalPrice,
        tasks,
      };
    });

    res.json(categoriesWithProgress);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch categories',
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body as CreateCategoryRequest;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category name is required',
      });
    }

    if (req.user!.weddingId == null) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No active wedding selected',
      });
    }

    const maxPosition = await prisma.category.aggregate({
      where: { weddingId: req.user!.weddingId },
      _max: { position: true },
    });
    const category = await prisma.category.create({
      data: { name, weddingId: req.user!.weddingId, position: (maxPosition._max.position ?? -1) + 1 },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            subtasks: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    const categoryWithProgress: CategoryDTO = {
      ...category,
      averageProgress: 0,
      totalPrice: 0,
      tasks: [],
    };

    res.status(201).json(categoryWithProgress);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category',
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body as UpdateCategoryRequest;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category name is required',
      });
    }

    if ((await categoryWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            subtasks: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    const allSubtasks = category.tasks.flatMap((task) => task.subtasks);
    const averageProgress = calculateWeightedAverage(allSubtasks);
    const totalPrice = calculateTotalPrice(allSubtasks);

    const tasks = category.tasks.map((task) => ({
      ...task,
      averageProgress: calculateWeightedAverage(task.subtasks),
      totalPrice: calculateTotalPrice(task.subtasks),
      subtasks: task.subtasks,
    }));

    const categoryWithProgress: CategoryDTO = {
      ...category,
      averageProgress,
      totalPrice,
      tasks,
    };

    res.json(categoryWithProgress);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category',
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if ((await categoryWeddingId(parseInt(id))) !== req.user!.weddingId) {
      return res.status(404).json({ error: 'Not Found', message: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category',
    });
  }
};

export const reorderCategories = async (req: AuthRequest, res: Response) => {
  try {
    const { orderedIds } = req.body as ReorderRequest;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderedIds must be an array',
      });
    }

    // Only reorder categories that belong to the user's wedding.
    const owned = await prisma.category.count({
      where: { id: { in: orderedIds }, weddingId: req.user!.weddingId ?? -1 },
    });
    if (owned !== orderedIds.length) {
      return res.status(403).json({ error: 'Forbidden', message: 'Cannot reorder these categories' });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({ where: { id }, data: { position: index } })
      )
    );

    res.status(204).send();
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reorder categories',
    });
  }
};
