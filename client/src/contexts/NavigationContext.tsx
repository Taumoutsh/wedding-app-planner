import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

export interface NavTarget {
  categoryId: number;
  taskId: number;
  subtaskId: number;
  // Bumped on every navigation so selecting the same subtask twice re-triggers
  // the expand/scroll effects (the object identity changes).
  nonce: number;
}

interface NavigationContextValue {
  target: NavTarget | null;
  navigateToSubtask: (categoryId: number, taskId: number, subtaskId: number) => void;
  // Cleared once the target subtask has been reached, so later folding/unfolding
  // doesn't re-trigger the navigation.
  clearTarget: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<NavTarget | null>(null);

  const navigateToSubtask = useCallback(
    (categoryId: number, taskId: number, subtaskId: number) => {
      setTarget((prev) => ({ categoryId, taskId, subtaskId, nonce: (prev?.nonce ?? 0) + 1 }));
    },
    []
  );

  const clearTarget = useCallback(() => setTarget(null), []);

  const value = useMemo(
    () => ({ target, navigateToSubtask, clearTarget }),
    [target, navigateToSubtask, clearTarget]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
};
