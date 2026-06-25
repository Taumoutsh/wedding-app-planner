import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { CreateCategoryRequest, UpdateCategoryRequest, CategoryDTO, ReorderRequest } from '@wedding-planner/shared';
import { calculateWeightedAverage, calculateTotalPrice } from '../utils/calculations';

export const getAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
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

    const categoriesWithProgress: CategoryDTO[] = categories.map((category: any) => {
      const allSubtasks = category.tasks.flatMap((task: any) => task.subtasks);
      const averageProgress = calculateWeightedAverage(allSubtasks);
      const totalPrice = calculateTotalPrice(allSubtasks);

      const tasks = category.tasks.map((task: any) => ({
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

    const maxPosition = await prisma.category.aggregate({ _max: { position: true } });
    const category = await prisma.category.create({
      data: { name, position: (maxPosition._max.position ?? -1) + 1 },
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

    const allSubtasks = category.tasks.flatMap((task: any) => task.subtasks);
    const averageProgress = calculateWeightedAverage(allSubtasks);
    const totalPrice = calculateTotalPrice(allSubtasks);

    const tasks = category.tasks.map((task: any) => ({
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
