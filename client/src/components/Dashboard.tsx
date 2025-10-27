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
      const isMobile = window.innerWidth < 640; // sm breakpoint

      if (isMobile) {
        // On mobile: always show scrolled state (collapsed header)
        setIsScrolled(true);
      } else {
        // On desktop: show scrolled state when scrolling down
        setIsScrolled(window.scrollY > 0);
      }
    };

    // Set initial state
    setIsScrolled(window.innerWidth < 640);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
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
      <header className="bg-gradient-to-r from-[#EB9E6C] via-[#F40E5E] to-[#FA8457] shadow-lg sticky top-0 z-10 transition-all duration-300">
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
                className="p-2 text-white hover:bg-white/20 rounded-md transition"
                title={t('dashboard.logout')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          {/* Compact title for scrolled state on mobile */}
          {isScrolled && (
            <div className="flex justify-between items-center sm:hidden mb-2">
              <h1 className="text-lg font-bold text-white">{t('dashboard.heading')}</h1>
              <button
                onClick={logout}
                className="p-2 text-white hover:bg-white/20 rounded-md transition"
                title={t('dashboard.logout')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          {/* Stats section - grid layout changes based on scroll state */}
          <div className={`grid items-center ${isScrolled ? 'grid-cols-12 gap-2' : 'grid-cols-1 sm:grid-cols-3 gap-4'}`}>
            {isScrolled ? (
              <>
                {/* Progress bar section - 4 columns */}
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <div className="flex-1 bg-white/30 rounded-full h-2 min-w-0">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress()}%` }}
                    />
                  </div>
                  <span className="font-bold text-white text-xs min-w-fit">
                    {overallProgress().toFixed(1)}%
                  </span>
                </div>

                {/* Separator */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="h-4 w-px bg-white/30"></div>
                </div>

                {/* Budget - 5 columns */}
                <div className="col-span-5 flex items-center gap-1 min-w-0">
                  <span className="font-bold text-white text-xs truncate">
                    {totalBudget().toFixed(2)}€
                  </span>
                </div>

                {/* Spacer to push logout to the right */}
                <div className="col-span-1"></div>

                {/* Logout button - 1 column, pushed to right */}
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center justify-center p-1.5 text-white hover:bg-white/20 rounded-md transition col-span-1"
                  title={t('dashboard.logout')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Progress section - full width on non-scrolled */}
                <div className="col-span-1 sm:col-span-1 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <span className="font-semibold text-pink-100 whitespace-nowrap text-xs sm:text-sm">
                      {t('dashboard.overallProgress')}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-1 bg-white/30 rounded-full h-2 min-w-0">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${overallProgress()}%` }}
                        />
                      </div>
                      <span className="font-bold text-white min-w-fit text-xs sm:text-sm min-w-[3.5rem]">
                        {overallProgress().toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Separator - non-scrolled */}
                <div className="col-span-1 sm:col-span-1 flex items-center justify-center">
                  <div className="h-6 w-px bg-white/30"></div>
                </div>

                {/* Budget section - non-scrolled */}
                <div className="col-span-1 sm:col-span-1 flex items-center gap-1 sm:gap-2 min-w-0">
                  <span className="font-semibold text-pink-100 whitespace-nowrap text-xs sm:text-sm">
                    {t('dashboard.totalBudget')}
                  </span>
                  <span className="font-bold text-white truncate text-xs sm:text-sm">
                    {totalBudget().toFixed(2)}€
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t('dashboard.noCategoriesEmpty')}</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-[#F40E5E] text-white rounded-md hover:opacity-90 transition"
            >
              {t('dashboard.createCategory')}
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onUpdate={loadCategories}
              />
            ))}

            {/* Add category button below the last category */}
            <div className="flex justify-center pt-2 sm:pt-4">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#F40E5E] text-white rounded-md hover:opacity-90 transition font-semibold shadow-md text-sm sm:text-base"
              >
                {t('dashboard.addCategory')}
              </button>
            </div>
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
