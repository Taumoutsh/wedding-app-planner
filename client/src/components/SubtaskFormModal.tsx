import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { subtaskApi } from '../services/api';
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
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      setComment(subtask.comment);
      setDate(new Date(subtask.date).toISOString().split('T')[0]);
      setProgressPercentage(subtask.progressPercentage);
      setWeight(subtask.weight);
    } else {
      setTitle('');
      setComment('');
      setDate(new Date().toISOString().split('T')[0]);
      setProgressPercentage(0);
      setWeight(1);
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
        date: new Date(date),
        progressPercentage,
        weight,
      };

      if (subtask) {
        await subtaskApi.update(subtask.id, data);
      } else {
        await subtaskApi.create({ ...data, taskId });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save subtask');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subtask ? 'Edit Subtask' : 'Create Subtask'}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Subtask Title
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
            Comment
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
              Progress (%)
            </label>
            <input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <input
              id="weight"
              type="number"
              min="1"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : subtask ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
