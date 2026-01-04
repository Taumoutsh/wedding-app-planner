import { useTranslation } from '../i18n/useTranslation';
import type { CategoryDTO } from '@wedding-planner/shared';

interface EisenhowerMatrixProps {
  categories: CategoryDTO[];
  onEditSubtask: (subtaskId: number, taskId: number) => void;
}

export const EisenhowerMatrix = ({ categories, onEditSubtask }: EisenhowerMatrixProps) => {
  const { t } = useTranslation();

  // Flatten all subtasks from all categories
  const allSubtasks = categories.flatMap((category) =>
    category.tasks?.flatMap((task) =>
      task.subtasks?.map((subtask) => ({
        ...subtask,
        taskId: task.id,
        taskTitle: task.title,
        categoryName: category.name,
      })) || []
    ) || []
  );

  // Categorize subtasks by urgent/important
  const urgentImportant = allSubtasks.filter((s) => s.urgent && s.important);
  const notUrgentImportant = allSubtasks.filter((s) => !s.urgent && s.important);
  const urgentNotImportant = allSubtasks.filter((s) => s.urgent && !s.important);
  const notUrgentNotImportant = allSubtasks.filter((s) => !s.urgent && !s.important);

  const renderSubtask = (subtask: any) => {
    const getProgressColor = (progress: number) => {
      if (progress >= 80) return 'bg-green-500';
      if (progress >= 60) return 'bg-lime-500';
      if (progress >= 40) return 'bg-yellow-500';
      if (progress >= 20) return 'bg-orange-500';
      return 'bg-red-500';
    };

    return (
      <div
        key={subtask.id}
        onClick={() => onEditSubtask(subtask.id, subtask.taskId)}
        className="bg-white rounded p-2 mb-2 cursor-pointer hover:shadow-md transition text-xs border border-gray-200"
      >
        <div className="font-semibold text-gray-800 mb-1">{subtask.title}</div>
        <div className="text-gray-500 text-xs mb-1">
          {subtask.categoryName} → {subtask.taskTitle}
        </div>
        {subtask.comment && (
          <p className="text-gray-600 mb-2 whitespace-pre-wrap">{subtask.comment}</p>
        )}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getProgressColor(subtask.progressPercentage)}`}
            style={{ width: `${subtask.progressPercentage}%` }}
          />
        </div>
        <div className="text-gray-500 text-xs mt-1">{subtask.progressPercentage}%</div>
      </div>
    );
  };

  const renderQuadrant = (
    title: string,
    description: string,
    subtasks: any[],
    bgColor: string,
    textColor: string
  ) => (
    <div className={`${bgColor} rounded-lg p-4 flex flex-col`}>
      <div className="mb-3">
        <h3 className={`font-bold text-sm ${textColor} mb-1`}>{title}</h3>
        <p className={`text-xs ${textColor} opacity-80`}>{description}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {subtasks.length === 0 ? (
          <p className={`text-xs ${textColor} opacity-60 italic`}>
            {t('eisenhowerMatrix.noSubtasks')}
          </p>
        ) : (
          subtasks.map(renderSubtask)
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {renderQuadrant(
          t('eisenhowerMatrix.urgentImportant'),
          t('eisenhowerMatrix.urgentImportantDesc'),
          urgentImportant,
          'bg-red-100',
          'text-red-900'
        )}
        {renderQuadrant(
          t('eisenhowerMatrix.notUrgentImportant'),
          t('eisenhowerMatrix.notUrgentImportantDesc'),
          notUrgentImportant,
          'bg-green-100',
          'text-green-900'
        )}
        {renderQuadrant(
          t('eisenhowerMatrix.urgentNotImportant'),
          t('eisenhowerMatrix.urgentNotImportantDesc'),
          urgentNotImportant,
          'bg-yellow-100',
          'text-yellow-900'
        )}
        {renderQuadrant(
          t('eisenhowerMatrix.notUrgentNotImportant'),
          t('eisenhowerMatrix.notUrgentNotImportantDesc'),
          notUrgentNotImportant,
          'bg-gray-100',
          'text-gray-900'
        )}
      </div>
    </div>
  );
};
