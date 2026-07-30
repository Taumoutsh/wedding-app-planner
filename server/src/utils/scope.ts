import { prisma } from './db';

// Helpers to resolve which wedding a category/task/subtask belongs to, so
// controllers can reject cross-wedding access. They return null when the row
// doesn't exist.
export const categoryWeddingId = async (id: number): Promise<number | null> => {
  const c = await prisma.category.findUnique({ where: { id }, select: { weddingId: true } });
  return c?.weddingId ?? null;
};

export const taskWeddingId = async (id: number): Promise<number | null> => {
  const t = await prisma.task.findUnique({
    where: { id },
    select: { category: { select: { weddingId: true } } },
  });
  return t?.category.weddingId ?? null;
};

export const subtaskWeddingId = async (id: number): Promise<number | null> => {
  const s = await prisma.subtask.findUnique({
    where: { id },
    select: { task: { select: { category: { select: { weddingId: true } } } } },
  });
  return s?.task.category.weddingId ?? null;
};
