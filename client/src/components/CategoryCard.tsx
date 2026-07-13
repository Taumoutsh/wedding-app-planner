import { useState, useEffect } from 'react';
import type { CategoryDTO, TaskDTO } from '@wedding-planner/shared';
import { categoryApi, taskApi } from '../services/api';
import { TaskCard } from './TaskCard';
import { CategoryFormModal } from './CategoryFormModal';
import { TaskFormModal } from './TaskFormModal';
import { ConfirmDialog } from './ConfirmDialog';
import { SortableList, DragHandle, type DragHandleProps } from './SortableList';
import { useTranslation } from '../i18n/useTranslation';
import { useNavigation } from '../contexts/NavigationContext';
import { useBudget, SPENDING_MASK } from '../contexts/BudgetContext';

interface CategoryCardProps {
  category: CategoryDTO;
  onUpdate: () => void;
  dragHandle?: DragHandleProps;
  // When false, drag-and-drop is disabled (e.g. in "remaining only" mode where
  // the task list is filtered and reordering would corrupt positions).
  sortable?: boolean;
}

export const CategoryCard = ({ category, onUpdate, dragHandle, sortable = true }: CategoryCardProps) => {
  const { t } = useTranslation();
  const { target } = useNavigation();
  const { showSpending } = useBudget();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed
  const [tasks, setTasks] = useState<TaskDTO[]>(category.tasks ?? []);

  // Expand automatically when a search result points to a subtask in this category.
  useEffect(() => {
    if (target && target.categoryId === category.id) {
      setIsExpanded(true);
      document.cookie = `category-${category.id}-expanded=true; path=/; max-age=31536000`;
    }
  }, [target, category.id]);

  // Keep local task order in sync when the category data is refreshed.
  useEffect(() => {
    setTasks(category.tasks ?? []);
  }, [category.tasks]);

  const handleReorderTasks = async (orderedIds: number[]) => {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((task): task is TaskDTO => task !== undefined);
    setTasks(reordered);
    try {
      await taskApi.reorder(orderedIds);
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      onUpdate();
    }
  };

  // Load expand/collapse state from cookies
  useEffect(() => {
    const cookieName = `category-${category.id}-expanded`;
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
  }, [category.id]);

  // Save expand/collapse state to cookies
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    const cookieName = `category-${category.id}-expanded`;
    document.cookie = `${cookieName}=${newState}; path=/; max-age=31536000`; // 1 year
  };

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
        <div className="bg-gradient-to-r from-[#D97B8A] to-[#E8B4A1] p-2 sm:p-4">
          <div className="flex justify-between items-start">
            <DragHandle handle={dragHandle} className="p-1 mt-0.5 text-white/80 hover:text-white" />
            <button
              onClick={toggleExpanded}
              className="flex-1 flex items-start gap-1 sm:gap-3 hover:opacity-80 transition text-left"
              title={isExpanded ? t('categoryCard.collapse') : t('categoryCard.expand')}
            >
              <div className="p-0.5 sm:p-1 text-white flex-shrink-0 mt-0.5">
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {category.name}
                </h2>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-[80px] bg-white/30 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.averageProgress}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                      {category.averageProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-px h-5 bg-white/30"></div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <span className="text-white/80">💰</span>
                    <span className="font-semibold text-white">
                      {showSpending ? `${(category.totalPrice || 0).toFixed(2)}€` : SPENDING_MASK}
                    </span>
                  </div>
                </div>
              </div>
            </button>

            <div className="flex gap-0.5 sm:gap-2 flex-shrink-0 -mr-1 sm:mr-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded transition"
                title={t('categoryCard.editCategory')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded transition"
                title={t('categoryCard.deleteCategory')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-2 sm:p-4 border-t border-gray-200">
            {!category.tasks || category.tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">{t('categoryCard.noTasks')}</p>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-3 sm:px-4 py-2 bg-[#D97B8A] text-white rounded-md hover:opacity-90 transition text-sm"
                >
                  {t('categoryCard.addTask')}
                </button>
              </div>
            ) : (
              <>
                {sortable ? (
                  <SortableList
                    items={tasks}
                    getId={(task) => task.id}
                    onReorder={handleReorderTasks}
                    strategy="grid"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 mb-4"
                    renderItem={(task, taskDragHandle) => (
                      <TaskCard task={task} onUpdate={onUpdate} dragHandle={taskDragHandle} />
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 mb-4">
                    {tasks.map((task) => (
                      <TaskCard key={task.id} task={task} onUpdate={onUpdate} sortable={false} />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-[#D97B8A] hover:text-[#D97B8A] transition"
                >
                  {t('categoryCard.addTask')}
                </button>
              </>
            )}
          </div>
        )}
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
        title={t('categoryCard.deleteTitle')}
        message={t('categoryCard.deleteMessage', { name: category.name })}
      />
    </>
  );
};
