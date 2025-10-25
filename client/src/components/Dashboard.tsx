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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const totalBudget = () => {
    return Math.round(categories.reduce((sum, cat) => sum + (cat.totalPrice || 0), 0) * 100) / 100;
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
      <header className="bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg sticky top-0 z-10 transition-all duration-300">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isScrolled ? 'py-2 sm:py-3' : 'py-6'}`}>
          {/* Title section - hidden on mobile when scrolled */}
          {!isScrolled && (
            <div className="flex justify-between items-start mb-4 sm:mb-0">
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
          )}

          {/* Compact title for scrolled state on mobile */}
          {isScrolled && (
            <div className="flex justify-between items-center sm:hidden mb-2">
              <h1 className="text-lg font-bold text-white">{t('dashboard.heading')}</h1>
              <button
                onClick={logout}
                className="px-2 py-1 text-xs text-pink-500 hover:text-pink-700 bg-white hover:bg-pink-50 border border-white rounded transition font-medium"
              >
                {t('dashboard.logout')}
              </button>
            </div>
          )}

          {/* Stats section - grid layout changes based on scroll state */}
          <div className={`grid items-center ${isScrolled ? 'grid-cols-3 sm:grid-cols-4 gap-2' : 'grid-cols-1 sm:grid-cols-3 gap-4'}`}>
            {/* Progress section */}
            <div className={`col-span-2 sm:col-span-1 flex ${isScrolled ? 'flex-col gap-1' : 'flex-col gap-3'}`}>
              <div className={`flex ${isScrolled ? 'flex-col gap-1' : 'flex-col sm:flex-row sm:items-center gap-2'}`}>
                <span className={`font-semibold text-pink-100 whitespace-nowrap ${isScrolled ? 'text-xs hidden sm:inline' : 'text-xs sm:text-sm'}`}>
                  {t('dashboard.overallProgress')}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress()}%` }}
                    />
                  </div>
                  <span className={`font-bold text-white min-w-fit ${isScrolled ? 'text-xs' : 'text-xs sm:text-sm min-w-[3.5rem]'}`}>
                    {overallProgress().toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Budget - show when expanded (all devices) or scrolled desktop */}
            {(!isScrolled || (isScrolled && window.innerWidth >= 640)) && (
              <div className={`flex col-span-1 items-center gap-2 ${isScrolled ? 'col-span-1' : 'col-span-1 sm:col-span-1'}`}>
                <span className={`font-semibold text-pink-100 whitespace-nowrap ${isScrolled ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                  {!isScrolled && t('dashboard.totalBudget')}
                </span>
                <span className={`font-bold text-white ${isScrolled ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                  {totalBudget().toFixed(2)}€
                </span>
              </div>
            )}

            {/* Add button */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className={`bg-white text-pink-600 hover:bg-pink-50 rounded-md transition font-semibold shadow-md ${isScrolled ? 'px-2 py-1 text-xs col-span-1' : 'px-4 py-2 text-sm sm:text-base h-fit sm:h-auto col-span-1'}`}
            >
              <span className="hidden sm:inline">{t('dashboard.addCategory')}</span>
              <span className="inline sm:hidden">{isScrolled ? '+' : t('dashboard.addCategoryMobile')}</span>
            </button>

            {/* Logout button - shown on scrolled state desktop only */}
            {isScrolled && (
              <button
                onClick={logout}
                className="hidden sm:block px-3 py-1 text-xs text-pink-500 hover:text-pink-700 bg-white hover:bg-pink-50 border border-white rounded transition font-medium col-span-1"
              >
                {t('dashboard.logout')}
              </button>
            )}
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
