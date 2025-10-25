import { useState } from 'react';
import type { SubtaskDTO } from '@wedding-planner/shared';
import { subtaskApi } from '../services/api';
import { SubtaskFormModal } from './SubtaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';

interface SubtaskItemProps {
  subtask: SubtaskDTO;
  onUpdate: () => void;
}

export const SubtaskItem = ({ subtask, onUpdate }: SubtaskItemProps) => {
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

  return (
    <>
      <div className="bg-gray-50 rounded p-3 text-xs hover:bg-gray-100 transition">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900">{subtask.title}</h4>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded transition"
                  title="Edit subtask"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="p-1 text-gray-500 hover:text-red-600 rounded transition"
                  title="Delete subtask"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-gray-600 mt-1">{subtask.createdBy}</p>
          </div>
        </div>

        {subtask.comment && (
          <p className="text-gray-600 mb-2">{subtask.comment}</p>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Progress:</span>
            <span className="font-semibold text-gray-900">
              {subtask.progressPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Weight:</span>
            <span className="font-semibold text-gray-900">{subtask.weight}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Date:</span>
            <span className="font-semibold text-gray-900">
              {formatDate(subtask.date)}
            </span>
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
        title="Delete Subtask"
        message={`Are you sure you want to delete "${subtask.title}"?`}
      />
    </>
  );
};
