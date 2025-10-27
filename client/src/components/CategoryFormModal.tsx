import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { categoryApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import type { CategoryDTO } from '@wedding-planner/shared';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: CategoryDTO;
}

export const CategoryFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryFormModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName('');
    }
    setError('');
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (category) {
        await categoryApi.update(category.id, { name });
      } else {
        await categoryApi.create({ name });
      }
      onSuccess();
      onClose();
      setName('');
    } catch (err: any) {
      setError(err.response?.data?.message || t('categoryFormModal.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? t('categoryFormModal.editTitle') : t('categoryFormModal.createTitle')}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('categoryFormModal.categoryName')}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
            required
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            disabled={loading}
          >
            {t('categoryFormModal.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#D97B8A] text-white rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t('categoryFormModal.saving') : category ? t('categoryFormModal.update') : t('categoryFormModal.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
