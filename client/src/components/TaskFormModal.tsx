import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { taskApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import type { TaskDTO } from '@wedding-planner/shared';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: number;
  task?: TaskDTO;
}

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  categoryId,
  task,
}: TaskFormModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setComment(task.comment);
    } else {
      setTitle('');
      setComment('');
    }
    setError('');
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (task) {
        await taskApi.update(task.id, { title, comment });
      } else {
        await taskApi.create({ categoryId, title, comment });
      }
      onSuccess();
      onClose();
      setTitle('');
      setComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || t('taskFormModal.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? t('taskFormModal.editTitle') : t('taskFormModal.createTitle')}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('taskFormModal.taskTitle')}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            {t('taskFormModal.comment')}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            disabled={loading}
          >
            {t('taskFormModal.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t('taskFormModal.saving') : task ? t('taskFormModal.update') : t('taskFormModal.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
