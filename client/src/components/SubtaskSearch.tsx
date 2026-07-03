import { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryDTO } from '@wedding-planner/shared';
import { useTranslation } from '../i18n/useTranslation';
import { useNavigation } from '../contexts/NavigationContext';

// Lower-case and strip diacritics so "echeance" matches "Échéance".
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// French + English month names (accents already stripped by normalize).
const MONTH_NAMES: Array<[string, number]> = [
  ['janvier', 1], ['fevrier', 2], ['mars', 3], ['avril', 4], ['mai', 5], ['juin', 6],
  ['juillet', 7], ['aout', 8], ['septembre', 9], ['octobre', 10], ['novembre', 11], ['decembre', 12],
  ['january', 1], ['february', 2], ['march', 3], ['april', 4], ['may', 5], ['june', 6],
  ['july', 7], ['august', 8], ['september', 9], ['october', 10], ['november', 11], ['december', 12],
];

// Resolve a token to a month number by prefix (min 3 chars) when it is unambiguous:
// "juil" -> 7, "sept" -> 9, "mar" -> 3 (mars/march both month 3), etc.
const monthFromToken = (tokenNorm: string): number | null => {
  if (tokenNorm.length < 3) return null;
  const months = new Set<number>();
  for (const [name, m] of MONTH_NAMES) {
    if (name.startsWith(tokenNorm)) months.add(m);
  }
  return months.size === 1 ? [...months][0] : null;
};

interface DateQuery {
  day?: number;
  month?: number;
  year?: number;
}

// Parse a query as a date. Supports DD/MM, DD/MM/YYYY (also . or - separators, 2-digit
// years), a standalone 4-digit year, and natural language such as "4 juillet 2026",
// "juillet 2026", "1er août". Returns null when the query is not date-like.
const parseDateQuery = (raw: string): DateQuery | null => {
  const q = raw.trim();
  if (!q) return null;

  const numeric = q.match(/^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?$/);
  if (numeric) {
    const day = parseInt(numeric[1], 10);
    const month = parseInt(numeric[2], 10);
    let year = numeric[3] !== undefined ? parseInt(numeric[3], 10) : undefined;
    if (year !== undefined && year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { day, month, year };
  }

  if (/^\d{4}$/.test(q)) return { year: parseInt(q, 10) };

  const tokens = normalize(q).split(/[\s,]+/).filter(Boolean);
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;
  for (const tok of tokens) {
    if (/^\d{4}$/.test(tok)) {
      year = parseInt(tok, 10);
      continue;
    }
    // A day number, optionally with a French ordinal suffix (1er, 2e, 2eme...).
    const dayMatch = tok.match(/^(\d{1,2})(?:er|ere|eme|e)?$/);
    if (dayMatch) {
      const n = parseInt(dayMatch[1], 10);
      if (n < 1 || n > 31) return null;
      day = n;
      continue;
    }
    const m = monthFromToken(tok);
    if (m) {
      month = m;
      continue;
    }
    // An unrecognised word means this isn't a date query.
    return null;
  }

  if (month === undefined && year === undefined) return null;
  return { day, month, year };
};

const matchesDate = (d: Date, q: DateQuery): boolean => {
  if (q.day !== undefined && d.getDate() !== q.day) return false;
  if (q.month !== undefined && d.getMonth() + 1 !== q.month) return false;
  if (q.year !== undefined && d.getFullYear() !== q.year) return false;
  return true;
};

interface Entry {
  categoryId: number;
  taskId: number;
  subtaskId: number;
  title: string;
  categoryName: string;
  taskTitle: string;
  norm: string;
  date: Date | null;
}

const MAX_RESULTS = 50;

interface SubtaskSearchProps {
  categories: CategoryDTO[];
}

export const SubtaskSearch = ({ categories }: SubtaskSearchProps) => {
  const { t, language } = useTranslation();
  const { navigateToSubtask } = useNavigation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

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
            date: sub.date ? new Date(sub.date) : null,
          });
        }
      }
    }
    return list;
  }, [categories]);

  // Match by title, and also by deadline date when the query looks like a date.
  // Title hits come first; the union is de-duplicated by subtask id.
  const results = useMemo<Entry[]>(() => {
    const nq = normalize(query.trim());
    if (!nq) return [];
    const dateQuery = parseDateQuery(query);

    const titleMatches = entries.filter((e) => e.norm.includes(nq));
    const dateMatches = dateQuery
      ? entries.filter((e) => e.date && matchesDate(e.date, dateQuery))
      : [];

    const seen = new Set<number>();
    const merged: Entry[] = [];
    for (const e of [...titleMatches, ...dateMatches]) {
      if (seen.has(e.subtaskId)) continue;
      seen.add(e.subtaskId);
      merged.push(e);
    }
    return merged.slice(0, MAX_RESULTS);
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
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{entry.title}</span>
                  {entry.date && (
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {entry.date.toLocaleDateString(locale)}
                    </span>
                  )}
                </div>
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
