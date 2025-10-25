import { Subtask } from '@prisma/client';

export const calculateWeightedAverage = (subtasks: Subtask[]): number => {
  if (subtasks.length === 0) return 0;

  const totalWeight = subtasks.reduce((sum, subtask) => sum + subtask.weight, 0);

  if (totalWeight === 0) return 0;

  const weightedSum = subtasks.reduce(
    (sum, subtask) => sum + (subtask.progressPercentage * subtask.weight),
    0
  );

  return Math.round((weightedSum / totalWeight) * 100) / 100;
};
