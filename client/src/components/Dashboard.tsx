import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { categoryApi } from '../services/api';
import type { CategoryDTO } from '@wedding-planner/shared';
import { CategoryCard } from './CategoryCard';
import { CategoryFormModal } from './CategoryFormModal';

export const Dashboard = () => {
  const { user, logout } = useAuth();
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
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Wedding Planner
              </h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.username}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Overall Progress:</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-pink-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress()}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {overallProgress().toFixed(1)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition text-sm sm:text-base"
            >
              + Add Category
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No categories yet. Create your first one!</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition"
            >
              + Create Category
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
