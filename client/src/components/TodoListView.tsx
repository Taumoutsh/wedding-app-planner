import { useMemo, useState } from 'react';
import type { CategoryDTO } from '@wedding-planner/shared';
import { subtaskApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';

interface TodoItem {
  subtaskId: number;
  title: string;
  categoryName: string;
  taskTitle: string;
  date: Date | null;
  progressPercentage: number;
}

interface TodoListViewProps {
  categories: CategoryDTO[];
  onUpdate: () => void;
  onBack: () => void;
}

const getProgressColor = (percentage: number) => {
  if (percentage === 0) return 'bg-gray-300';
  if (percentage < 25) return 'bg-red-500';
  if (percentage < 50) return 'bg-orange-500';
  if (percentage < 75) return 'bg-yellow-500';
  if (percentage < 100) return 'bg-lime-500';
  return 'bg-green-500';
};

export const TodoListView = ({ categories, onUpdate, onBack }: TodoListViewProps) => {
  const { t, language } = useTranslation();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  // Ids currently being removed, so their row can fade out before the refetch.
  const [removing, setRemoving] = useState<Set<number>>(new Set());

  const items = useMemo<TodoItem[]>(() => {
    const list: TodoItem[] = [];
    for (const cat of categories) {
      for (const task of cat.tasks ?? []) {
        for (const sub of task.subtasks ?? []) {
          if (!sub.inTodoList) continue;
          list.push({
            subtaskId: sub.id,
            title: sub.title,
            categoryName: cat.name,
            taskTitle: task.title,
            date: sub.date ? new Date(sub.date) : null,
            progressPercentage: sub.progressPercentage,
          });
        }
      }
    }
    // Soonest deadlines first; undated items last.
    return list.sort((a, b) => {
      if (a.date && b.date) return a.date.getTime() - b.date.getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
  }, [categories]);

  const handleRemove = async (subtaskId: number) => {
    setRemoving((prev) => new Set(prev).add(subtaskId));
    try {
      await subtaskApi.setTodo(subtaskId, false);
      onUpdate();
    } catch (error) {
      console.error('Failed to remove from todo list:', error);
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(subtaskId);
        return next;
      });
    }
  };

  const backButton = (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-md bg-white text-[#D97B8A] shadow-sm hover:bg-[#F5E6E8] text-sm font-medium transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {t('dashboard.backToAll')}
    </button>
  );

  if (items.length === 0) {
    return (
      <div>
        {backButton}
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-600">{t('todo.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {backButton}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-[#D97B8A] to-[#E8B4A1] px-4 py-3">
        <h2 className="text-lg font-bold text-white">
          {t('todo.viewTitle')}{' '}
          <span className="font-normal text-white/80">({items.length})</span>
        </h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => {
          const isPastDue = item.date && item.date < new Date();
          const isRemoving = removing.has(item.subtaskId);
          return (
            <li
              key={item.subtaskId}
              className={`flex items-center gap-3 px-4 py-3 transition ${isRemoving ? 'opacity-40' : 'hover:bg-gray-50'}`}
            >
              <button
                type="button"
                onClick={() => handleRemove(item.subtaskId)}
                disabled={isRemoving}
                className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#D97B8A] hover:bg-[#F5E6E8] flex items-center justify-center text-transparent hover:text-[#D97B8A] transition"
                title={t('todo.check')}
                aria-label={t('todo.check')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {item.categoryName} <span className="text-gray-400">›</span> {item.taskTitle}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {item.date && (
                  <span className={`text-xs whitespace-nowrap ${isPastDue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    {item.date.toLocaleDateString(locale)}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(item.progressPercentage)}`}
                      style={{ width: `${item.progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                    {item.progressPercentage}%
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
};
