import { useState } from 'react';
import type { CategoryDTO } from '@wedding-planner/shared';
import { categoryApi } from '../services/api';
import { TaskCard } from './TaskCard';
import { CategoryFormModal } from './CategoryFormModal';
import { TaskFormModal } from './TaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';

interface CategoryCardProps {
  category: CategoryDTO;
  onUpdate: () => void;
}

export const CategoryCard = ({ category, onUpdate }: CategoryCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await categoryApi.delete(category.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {category.name}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-48 bg-white/30 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${category.averageProgress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  {category.averageProgress.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-white hover:bg-white/20 rounded transition"
                title="Edit category"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 text-white hover:bg-white/20 rounded transition"
                title="Delete category"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {!category.tasks || category.tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">No tasks yet</p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition text-sm"
              >
                + Add Task
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {category.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={onUpdate} />
                ))}
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-pink-500 hover:text-pink-500 transition"
              >
                + Add Task
              </button>
            </>
          )}
        </div>
      </div>

      <CategoryFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={onUpdate}
        category={category}
      />

      <TaskFormModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={onUpdate}
        categoryId={category.id}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${category.name}"? This will also delete all tasks and subtasks within this category.`}
      />
    </>
  );
};
