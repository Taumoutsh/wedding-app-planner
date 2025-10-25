import { useState } from 'react';
import type { TaskDTO } from '@wedding-planner/shared';
import { taskApi } from '../services/api';
import { SubtaskItem } from './SubtaskItem';
import { TaskFormModal } from './TaskFormModal';
import { SubtaskFormModal } from './SubtaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';

interface TaskCardProps {
  task: TaskDTO;
  onUpdate: () => void;
}

export const TaskCard = ({ task, onUpdate }: TaskCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await taskApi.delete(task.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-300';
    if (percentage < 25) return 'bg-red-500';
    if (percentage < 50) return 'bg-orange-500';
    if (percentage < 75) return 'bg-yellow-500';
    if (percentage < 100) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const sortedSubtasks = task.subtasks ? [...task.subtasks].sort((a, b) => {
    // Handle null dates - push to bottom
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;

    const now = new Date();
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    const isPastA = dateA < now;
    const isPastB = dateB < now;

    // If one is past and the other isn't, past goes to bottom
    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;

    // Both are future or both are past: sort by date (closest first for future, oldest first for past)
    if (!isPastA && !isPastB) {
      return dateA.getTime() - dateB.getTime(); // Ascending for future dates
    } else {
      return dateA.getTime() - dateB.getTime(); // Ascending for past dates (oldest first)
    }
  }) : [];

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            {task.comment && (
              <p className="text-sm text-gray-600 mt-1">{task.comment}</p>
            )}
          </div>

          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.averageProgress)}`}
                style={{ width: `${task.averageProgress}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 min-w-[3rem] text-right">
              {task.averageProgress.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {sortedSubtasks.length > 0 ? (
            sortedSubtasks.map((subtask) => (
              <SubtaskItem key={subtask.id} subtask={subtask} onUpdate={onUpdate} />
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">No subtasks yet</p>
          )}
        </div>

        <button
          onClick={() => setShowSubtaskModal(true)}
          className="w-full mt-3 px-3 py-1.5 border border-dashed border-gray-300 text-gray-600 rounded text-sm hover:border-pink-500 hover:text-pink-500 transition"
        >
          + Add Subtask
        </button>
      </div>

      <TaskFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={onUpdate}
        task={task}
        categoryId={task.categoryId}
      />

      <SubtaskFormModal
        isOpen={showSubtaskModal}
        onClose={() => setShowSubtaskModal(false)}
        onSuccess={onUpdate}
        taskId={task.id}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This will also delete all subtasks within this task.`}
      />
    </>
  );
};
