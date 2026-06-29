import { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryDTO } from '@wedding-planner/shared';
import { useTranslation } from '../i18n/useTranslation';
import { useNavigation } from '../contexts/NavigationContext';

// Lower-case and strip diacritics so "echeance" matches "Échéance".
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Entry {
  categoryId: number;
  taskId: number;
  subtaskId: number;
  title: string;
  categoryName: string;
  taskTitle: string;
  norm: string;
}

const MAX_RESULTS = 50;

interface SubtaskSearchProps {
  categories: CategoryDTO[];
}

export const SubtaskSearch = ({ categories }: SubtaskSearchProps) => {
  const { t } = useTranslation();
  const { navigateToSubtask } = useNavigation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flat, searchable index of every loaded subtask with its parent path.
  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    for (const cat of categories) {
      for (const task of cat.tasks ?? []) {
        for (const sub of task.subtasks ?? []) {
          list.push({
            categoryId: cat.id,
            taskId: task.id,
            subtaskId: sub.id,
            title: sub.title,
            categoryName: cat.name,
            taskTitle: task.title,
            norm: normalize(sub.title),
          });
        }
      }
    }
    return list;
  }, [categories]);

  const results = useMemo<Entry[]>(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return entries.filter((e) => e.norm.includes(q)).slice(0, MAX_RESULTS);
  }, [entries, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Close the dropdown when clicking outside the search.
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const select = (entry: Entry) => {
    navigateToSubtask(entry.categoryId, entry.taskId, entry.subtaskId);
    setOpen(false);
    // Drop focus so the mobile on-screen keyboard dismisses after selecting.
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && results[activeIndex]) {
        e.preventDefault();
        select(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim() !== '';

  return (
    <div ref={containerRef} className="relative mt-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          // text-base (16px) on mobile stops iOS Safari from auto-zooming on focus; text-sm on desktop.
          className="w-full pl-9 pr-9 py-2 rounded-md bg-white/95 text-base sm:text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="subtask-search-listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            title={t('search.clear')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="subtask-search-listbox"
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-80 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5"
        >
          {results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500">{t('search.noResults')}</div>
          ) : (
            results.map((entry, i) => (
              <button
                key={entry.subtaskId}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                // onMouseDown (not onClick) so selection runs before the input blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(entry);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`block w-full text-left px-3 py-2 border-b border-gray-100 last:border-0 ${
                  i === activeIndex ? 'bg-[#F5E6E8]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 truncate">{entry.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {entry.categoryName} <span className="text-gray-400">›</span> {entry.taskTitle}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
