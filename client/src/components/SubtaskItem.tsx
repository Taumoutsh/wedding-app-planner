import { useState } from 'react';
import type { SubtaskDTO } from '@wedding-planner/shared';
import { subtaskApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import { SubtaskFormModal } from './SubtaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';

interface SubtaskItemProps {
  subtask: SubtaskDTO;
  onUpdate: () => void;
}

export const SubtaskItem = ({ subtask, onUpdate }: SubtaskItemProps) => {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await subtaskApi.delete(subtask.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-300';
    if (percentage < 25) return 'bg-red-500';
    if (percentage < 50) return 'bg-orange-500';
    if (percentage < 75) return 'bg-yellow-500';
    if (percentage < 100) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const isPastDue = subtask.date && new Date(subtask.date) < new Date();

  return (
    <>
      <div className={`bg-[#FB7FA0] bg-opacity-20 rounded p-2 sm:p-3 text-xs hover:bg-opacity-30 transition ${isPastDue ? 'opacity-50' : ''}`}>
        <div className="bg-[#FB7FA0] bg-opacity-30 -mx-2 sm:-mx-3 -mt-2 sm:-mt-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-t flex items-start gap-2 mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{subtask.title}</h4>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 text-gray-600 hover:text-gray-900 rounded transition"
              title={t('subtaskItem.editSubtask')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1 text-gray-600 hover:text-red-700 rounded transition"
              title={t('subtaskItem.deleteSubtask')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {subtask.comment && (
          <p className="text-gray-600 mb-2">{subtask.comment}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 min-w-[90px]">
              <div className="flex-1 bg-[#FB7FA0] bg-opacity-30 rounded-full h-1.5 max-w-[80px]">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(subtask.progressPercentage)}`}
                  style={{ width: `${subtask.progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-900 min-w-[2.5rem] text-center">
                {subtask.progressPercentage}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {subtask.date && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 text-xs hidden sm:inline">{t('subtaskItem.dateLabel')}</span>
                  <span className="font-semibold text-gray-900 text-xs">
                    {formatDate(subtask.date)}
                  </span>
                </div>
              )}

              {subtask.price && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 text-xs">💰</span>
                  <span className="font-semibold text-gray-900 text-xs">
                    {subtask.price.toFixed(2)}€
                  </span>
                </div>
              )}
            </div>
          </div>

          <span className="text-gray-500 italic text-xs sm:text-right">{subtask.createdBy}</span>
        </div>
      </div>

      <SubtaskFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={onUpdate}
        taskId={subtask.taskId}
        subtask={subtask}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('subtaskItem.deleteTitle')}
        message={t('subtaskItem.deleteMessage', { title: subtask.title })}
      />
    </>
  );
};
