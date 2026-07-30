import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categoryApi } from '../services/api';
import { useTranslation } from '../i18n/useTranslation';
import type { CategoryDTO } from '@wedding-planner/shared';
import { CategoryCard } from './CategoryCard';
import { CategoryFormModal } from './CategoryFormModal';
import { SortableList } from './SortableList';
import { SubtaskSearch } from './SubtaskSearch';
import { TodoListView } from './TodoListView';
import { NavigationProvider } from '../contexts/NavigationContext';
import { BudgetContext, SPENDING_MASK } from '../contexts/BudgetContext';
import { exportToExcel } from '../utils/exportToExcel';

interface DashboardProps {
  onOpenAdmin?: () => void;
}

export const Dashboard = ({ onOpenAdmin }: DashboardProps) => {
  const { user, logout } = useAuth();
  const { t, language } = useTranslation();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [remainingOnly, setRemainingOnly] = useState<boolean>(
    () => localStorage.getItem('remainingOnly') === 'true'
  );
  const [showTodoList, setShowTodoList] = useState(false);
  const [showSpending, setShowSpending] = useState<boolean>(
    () => localStorage.getItem('showSpending') !== 'false'
  );

  useEffect(() => {
    localStorage.setItem('remainingOnly', String(remainingOnly));
  }, [remainingOnly]);

  useEffect(() => {
    localStorage.setItem('showSpending', String(showSpending));
  }, [showSpending]);

  // In "remaining only" mode, hide anything already at 100%: completed subtasks,
  // completed tasks, and fully-complete categories.
  const visibleCategories = useMemo(() => {
    if (!remainingOnly) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        tasks: (cat.tasks ?? [])
          .filter((task) => task.averageProgress < 100)
          .map((task) => ({
            ...task,
            subtasks: (task.subtasks ?? []).filter((st) => st.progressPercentage < 100),
          })),
      }))
      .filter((cat) => cat.averageProgress < 100);
  }, [categories, remainingOnly]);

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

  const handleReorderCategories = async (orderedIds: number[]) => {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((category): category is CategoryDTO => category !== undefined);
    setCategories(reordered);
    try {
      await categoryApi.reorder(orderedIds);
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      loadCategories();
    }
  };

  const handleExport = async () => {
    if (exporting || categories.length === 0) return;
    setExporting(true);
    try {
      await exportToExcel(categories, t, language);
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">{t('dashboard.loading')}</div>
      </div>
    );
  }

  return (
    <NavigationProvider>
    <BudgetContext.Provider value={{ showSpending }}>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-br from-[#D97B8A] to-[#E8B4A1] shadow-lg sticky top-0 z-10 transition-all duration-300">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isScrolled ? 'py-2 sm:py-3' : 'py-6'}`}>
          {/* Title section - hidden on mobile when scrolled */}
          {!isScrolled && (
            <div className="flex justify-between items-start mb-6 sm:mb-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {t('dashboard.heading')}
                </h1>
                {user?.username && (
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5 truncate">
                    {user.username}
                    {user.weddingName ? <span className="text-white/60"> · {user.weddingName}</span> : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {categories.length > 0 && (
                  <button
                    onClick={() => setShowTodoList((v) => !v)}
                    aria-pressed={showTodoList}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md transition font-medium ${showTodoList ? 'bg-white text-[#D97B8A]' : 'text-white bg-white/10 hover:bg-white/20'}`}
                    title={t('dashboard.todoListButton')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    {t('dashboard.todoListButton')}
                  </button>
                )}
                {categories.length > 0 && (
                  <button
                    onClick={() => setShowSpending((v) => !v)}
                    aria-pressed={!showSpending}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition"
                    title={showSpending ? t('dashboard.hideSpending') : t('dashboard.showSpending')}
                    aria-label={showSpending ? t('dashboard.hideSpending') : t('dashboard.showSpending')}
                  >
                    {showSpending ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                )}
                {categories.length > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 rounded-md transition font-medium disabled:opacity-60"
                    title={t('export.button')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {exporting ? t('export.exporting') : t('export.button')}
                  </button>
                )}
                {user?.isAdmin && onOpenAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition"
                    title={t('admin.title')}
                    aria-label={t('admin.title')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
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
            </div>
          )}

          {/* Compact title for scrolled state on mobile */}
          {isScrolled && (
            <div className="flex justify-between items-start gap-2 sm:hidden mb-2">
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{t('dashboard.heading')}</h1>
                {user?.username && (
                  <p className="text-[11px] leading-tight text-white/80 truncate">
                    {user.username}
                    {user.weddingName ? <span className="text-white/60"> · {user.weddingName}</span> : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {categories.length > 0 && (
                  <button
                    onClick={() => setShowTodoList((v) => !v)}
                    aria-pressed={showTodoList}
                    className={`p-2 rounded-md transition ${showTodoList ? 'bg-white text-[#D97B8A]' : 'text-white hover:bg-white/20'}`}
                    title={t('dashboard.todoListButton')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </button>
                )}
                {categories.length > 0 && (
                  <button
                    onClick={() => setShowSpending((v) => !v)}
                    aria-pressed={!showSpending}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition"
                    title={showSpending ? t('dashboard.hideSpending') : t('dashboard.showSpending')}
                    aria-label={showSpending ? t('dashboard.hideSpending') : t('dashboard.showSpending')}
                  >
                    {showSpending ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                )}
                {categories.length > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition disabled:opacity-60"
                    title={t('export.button')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
                {user?.isAdmin && onOpenAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition"
                    title={t('admin.title')}
                    aria-label={t('admin.title')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
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
            </div>
          )}

          {/* Stats section - grid layout changes based on scroll state */}
          <div className="flex items-center gap-3">
          <div className={`grid items-center flex-1 min-w-0 ${isScrolled ? 'grid-cols-12 gap-2' : 'grid-cols-1 sm:grid-cols-3 gap-4'}`}>
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
                    {overallProgress().toFixed(0)}%
                  </span>
                </div>

                {/* Separator */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="h-4 w-px bg-white/30"></div>
                </div>

                {/* Budget - 5 columns */}
                <div className="col-span-5 flex items-center gap-1 min-w-0">
                  <span className="font-bold text-white text-xs truncate">
                    {showSpending ? `${totalBudget().toFixed(2)}€` : SPENDING_MASK}
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
                        {overallProgress().toFixed(0)}%
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
                    {showSpending ? `${totalBudget().toFixed(2)}€` : SPENDING_MASK}
                  </span>
                </div>
              </>
            )}
          </div>

          {categories.length > 0 && !showTodoList && (
            <button
              onClick={() => setRemainingOnly((v) => !v)}
              aria-pressed={remainingOnly}
              className="flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition"
              title={t('dashboard.remainingOnly')}
            >
              <span
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${remainingOnly ? 'bg-white' : 'bg-white/30'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-[#D97B8A] transition ${remainingOnly ? 'translate-x-3.5' : 'translate-x-0.5'}`}
                />
              </span>
              <span className="whitespace-nowrap">{t('dashboard.remainingOnly')}</span>
            </button>
          )}
          </div>

          {categories.length > 0 && !showTodoList && <SubtaskSearch categories={categories} />}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 relative">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t('dashboard.noCategoriesEmpty')}</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-[#D97B8A] text-white rounded-md hover:opacity-90 transition"
            >
              {t('dashboard.createCategory')}
            </button>
          </div>
        ) : showTodoList ? (
          <TodoListView
            categories={categories}
            onUpdate={loadCategories}
            onBack={() => setShowTodoList(false)}
          />
        ) : remainingOnly ? (
          <div className="space-y-3 sm:space-y-6">
            {visibleCategories.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-gray-600">{t('dashboard.allDone')}</p>
              </div>
            ) : (
              visibleCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onUpdate={loadCategories}
                  sortable={false}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-6">
            <SortableList
              items={categories}
              getId={(category) => category.id}
              onReorder={handleReorderCategories}
              strategy="vertical"
              className="space-y-3 sm:space-y-6"
              renderItem={(category, dragHandle) => (
                <CategoryCard
                  category={category}
                  onUpdate={loadCategories}
                  dragHandle={dragHandle}
                />
              )}
            />

            {/* Add category button below the last category */}
            <div className="flex justify-center pt-2 sm:pt-4">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#D97B8A] text-white rounded-md hover:opacity-90 transition font-semibold shadow-md text-sm sm:text-base"
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
    </BudgetContext.Provider>
    </NavigationProvider>
  );
};
