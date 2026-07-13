import { createContext, useContext } from 'react';

interface BudgetContextValue {
  // When false, every euro amount across the dashboard is masked.
  showSpending: boolean;
}

export const BudgetContext = createContext<BudgetContextValue>({ showSpending: true });

export const useBudget = () => useContext(BudgetContext);

// The mask shown in place of a hidden euro amount.
export const SPENDING_MASK = '•••';
