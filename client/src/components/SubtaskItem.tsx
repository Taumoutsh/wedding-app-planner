import { useState } from 'react';
import type { SubtaskDTO } from '@wedding-planner/shared';
import { subtaskApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import { SubtaskFormModal } from './SubtaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';
import { DragHandle, type DragHandleProps } from './SortableList';

interface SubtaskItemProps {
  subtask: SubtaskDTO;
  onUpdate: () => void;
  dragHandle?: DragHandleProps;
}

export const SubtaskItem = ({ subtask, onUpdate, dragHandle }: SubtaskItemProps) => {
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
      <div className={`bg-gradient-to-r from-[#F5E6E8] to-[#F9EDE8] rounded p-2 sm:p-3 text-xs hover:from-[#F0DDE0] hover:to-[#F5E5DF] transition ${isPastDue ? 'opacity-40' : ''}`}>
        <div className="bg-gradient-to-r from-[#D97B8A] to-[#E8B4A1] -mx-2 sm:-mx-3 -mt-2 sm:-mt-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-t flex items-start gap-2 mb-2">
          <DragHandle handle={dragHandle} className="p-0.5 text-white/80 hover:text-white" />
          <div className="flex-1">
            <h4 className="font-semibold text-white">{subtask.title}</h4>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 text-white hover:text-gray-100 rounded transition"
              title={t('subtaskItem.editSubtask')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1 text-white hover:text-red-100 rounded transition"
              title={t('subtaskItem.deleteSubtask')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {subtask.comment && (
          <p className="text-gray-600 mb-2 whitespace-pre-wrap">{subtask.comment}</p>
        )}

        {subtask.link && (
          <div className="mb-2">
            <a
              href={subtask.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#D97B8A] hover:text-[#C06B7A] underline text-xs"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>{t('subtaskItem.linkLabel')}</span>
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* Progress, date, and budget on one line */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Progress bar and percentage - fixed width */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-[50px] bg-[#F0DDE0] rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(subtask.progressPercentage)}`}
                  style={{ width: `${subtask.progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                {subtask.progressPercentage}%
              </span>
            </div>

            {/* Separator and date */}
            {subtask.date && (
              <>
                <div className="w-px h-4 bg-gray-300"></div>
                <span className="font-semibold text-gray-900 text-xs whitespace-nowrap">
                  {formatDate(subtask.date)}
                </span>
              </>
            )}

            {/* Separator and budget */}
            {subtask.price && (
              <>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 text-xs">💰</span>
                  <span className="font-semibold text-gray-900 text-xs whitespace-nowrap">
                    {subtask.price.toFixed(2)}€
                  </span>
                </div>
              </>
            )}
          </div>
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
