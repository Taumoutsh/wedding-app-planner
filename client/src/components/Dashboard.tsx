import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categoryApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import type { CategoryDTO } from '@wedding-planner/shared';
import { CategoryCard } from './CategoryCard';
import { CategoryFormModal } from './CategoryFormModal';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const overallProgress = () => {
    const allSubtasks = categories.flatMap((cat) =>
      cat.tasks?.flatMap((task) => task.subtasks || []) || []
    );

    if (allSubtasks.length === 0) return 0;

    const totalWeight = allSubtasks.reduce((sum, subtask) => sum + subtask.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = allSubtasks.reduce(
      (sum, subtask) => sum + (subtask.progressPercentage * subtask.weight),
      0
    );

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">{t('dashboard.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                {t('dashboard.heading')}
              </h1>
              <p className="text-sm sm:text-base text-pink-100 mt-1">
                {t('dashboard.welcome', { username: user?.username || '' })}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-pink-500 hover:text-pink-700 bg-white hover:bg-pink-50 border border-white rounded-md transition font-medium"
            >
              {t('dashboard.logout')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-pink-100 whitespace-nowrap">{t('dashboard.overallProgress')}</span>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 bg-white/30 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress()}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white min-w-[3.5rem]">
                  {overallProgress().toFixed(1)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-white text-pink-600 hover:bg-pink-50 rounded-md transition text-sm sm:text-base font-semibold shadow-md"
            >
              <span className="hidden sm:inline">{t('dashboard.addCategory')}</span>
              <span className="inline sm:hidden">{t('dashboard.addCategoryMobile')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t('dashboard.noCategoriesEmpty')}</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition"
            >
              {t('dashboard.createCategory')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onUpdate={loadCategories}
              />
            ))}
          </div>
        )}
      </main>

      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={loadCategories}
      />
    </div>
  );
};
