import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { subtaskApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import type { SubtaskDTO } from '@wedding-planner/shared';

interface SubtaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId: number;
  subtask?: SubtaskDTO;
}

export const SubtaskFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  taskId,
  subtask,
}: SubtaskFormModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [weight, setWeight] = useState(1);
  const [price, setPrice] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      setComment(subtask.comment);
      setDate(subtask.date ? new Date(subtask.date).toISOString().split('T')[0] : '');
      setProgressPercentage(subtask.progressPercentage);
      setWeight(subtask.weight);
      setPrice(subtask.price || null);
      setLink(subtask.link || '');
      setUrgent(subtask.urgent);
      setImportant(subtask.important);
    } else {
      setTitle('');
      setComment('');
      setDate('');
      setProgressPercentage(0);
      setWeight(1);
      setPrice(null);
      setLink('');
      setUrgent(false);
      setImportant(false);
    }
    setError('');
  }, [subtask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        title,
        comment,
        date: date ? new Date(date) : null,
        progressPercentage,
        weight,
        price: price || null,
        link: link || null,
        urgent,
        important,
      };

      if (subtask) {
        await subtaskApi.update(subtask.id, data);
      } else {
        await subtaskApi.create({ ...data, taskId });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('subtaskFormModal.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subtask ? t('subtaskFormModal.editTitle') : t('subtaskFormModal.createTitle')}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('subtaskFormModal.subtaskTitle')}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
            required
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            {t('subtaskFormModal.comment')}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
            {t('subtaskFormModal.link')}
          </label>
          <input
            id="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
            placeholder="https://..."
          />
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            {t('subtaskFormModal.dateLabel')}
          </label>
          <div className="relative overflow-hidden">
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-base"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontSize: '16px',
              }}
            />
            {date && (
              <button
                type="button"
                onClick={() => setDate('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition p-1 flex-shrink-0"
                title={t('subtaskFormModal.clearDate')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
              {t('subtaskFormModal.progress')}
            </label>
            <input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
              required
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              {t('subtaskFormModal.weight')}
            </label>
            <input
              id="weight"
              type="number"
              min="1"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
              required
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              {t('subtaskFormModal.price')}
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price || ''}
              onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
            />
          </div>
        </div>

        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="w-4 h-4 text-[#D97B8A] border-gray-300 rounded focus:ring-2 focus:ring-[#D97B8A]"
            />
            <span className="text-sm font-medium text-gray-700">{t('subtaskFormModal.urgent')}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
              className="w-4 h-4 text-[#D97B8A] border-gray-300 rounded focus:ring-2 focus:ring-[#D97B8A]"
            />
            <span className="text-sm font-medium text-gray-700">{t('subtaskFormModal.important')}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            disabled={loading}
          >
            {t('subtaskFormModal.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#D97B8A] text-white rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t('subtaskFormModal.saving') : subtask ? t('subtaskFormModal.update') : t('subtaskFormModal.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
