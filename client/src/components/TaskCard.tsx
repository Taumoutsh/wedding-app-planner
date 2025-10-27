import { useState, useEffect } from 'react';
import type { TaskDTO } from '@wedding-planner/shared';
import { taskApi } from '../services/api';
import { SubtaskItem } from './SubtaskItem';
import { TaskFormModal } from './TaskFormModal';
import { SubtaskFormModal } from './SubtaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';
import { useTranslation } from '../i18n/useTranslation';

interface TaskCardProps {
  task: TaskDTO;
  onUpdate: () => void;
}

export const TaskCard = ({ task, onUpdate }: TaskCardProps) => {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed

  // Load expand/collapse state from cookies
  useEffect(() => {
    const cookieName = `task-${task.id}-expanded`;
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(cookieName + '='))
      ?.split('=')[1];

    if (cookieValue !== undefined) {
      setIsExpanded(cookieValue === 'true');
    } else {
      // Initialize cookie with default collapsed state (false)
      document.cookie = `${cookieName}=false; path=/; max-age=31536000`; // 1 year
    }
  }, [task.id]);

  // Save expand/collapse state to cookies
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    const cookieName = `task-${task.id}-expanded`;
    document.cookie = `${cookieName}=${newState}; path=/; max-age=31536000`; // 1 year
  };

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
    const now = new Date();
    const hasDateA = a.date !== null;
    const hasDateB = b.date !== null;

    // Determine category for each subtask: 0=future, 1=no-date, 2=past
    const getCategoryOrder = (hasDate: boolean, date: Date | null): number => {
      if (!hasDate || !date) return 1; // no date = middle
      const isPast = new Date(date) < now;
      return isPast ? 2 : 0; // past = 2, future = 0
    };

    const categoryA = getCategoryOrder(hasDateA, a.date);
    const categoryB = getCategoryOrder(hasDateB, b.date);

    // Different categories: sort by category order (0, 1, 2)
    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    // Same category: sort by date within that category
    if (!hasDateA && !hasDateB) return 0; // both no date, keep order

    const dateA = a.date ? new Date(a.date) : now;
    const dateB = b.date ? new Date(b.date) : now;

    // Future dates: closest first (ascending)
    if (categoryA === 0) {
      return dateA.getTime() - dateB.getTime();
    }

    // Past dates: most recent first (descending)
    if (categoryA === 2) {
      return dateB.getTime() - dateA.getTime();
    }

    return 0;
  }) : [];

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
        <div className="p-2 sm:p-4 hover:bg-gray-50 transition">
          <button
            onClick={toggleExpanded}
            className="w-full flex justify-between items-start gap-2 mb-2"
            title={isExpanded ? t('taskCard.collapse') : t('taskCard.expand')}
          >
            <div className="flex-1 flex items-start gap-2 text-left">
              <div className="p-0.5 text-gray-600 flex-shrink-0 mt-0.5">
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                {task.comment && (
                  <p className="text-sm text-gray-600 mt-1">{task.comment}</p>
                )}
              </div>
            </div>

            <div className="flex gap-1 ml-2 flex-shrink-0 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition pointer-events-auto"
                title={t('taskCard.editTask')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition pointer-events-auto"
                title={t('taskCard.deleteTask')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </button>

          {/* Progress bar and budget - always visible in header */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-[80px] bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.averageProgress)}`}
                  style={{ width: `${task.averageProgress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                {task.averageProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-px h-5 bg-gray-300"></div>
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <span className="text-gray-500">💰</span>
              <span className="font-semibold text-gray-800">
                {(task.totalPrice || 0).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 p-2 sm:p-4">
            <div className="space-y-2">
              {sortedSubtasks.length > 0 ? (
                sortedSubtasks.map((subtask) => (
                  <SubtaskItem key={subtask.id} subtask={subtask} onUpdate={onUpdate} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">{t('taskCard.noSubtasks')}</p>
              )}
            </div>

            <button
              onClick={() => setShowSubtaskModal(true)}
              className="w-full mt-3 px-3 py-1.5 border border-dashed border-gray-300 text-gray-600 rounded text-sm hover:border-[#D97B8A] hover:text-[#D97B8A] transition"
            >
              {t('taskCard.addSubtask')}
            </button>
          </div>
        )}
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
        title={t('taskCard.deleteTitle')}
        message={t('taskCard.deleteMessage', { title: task.title })}
      />
    </>
  );
};
