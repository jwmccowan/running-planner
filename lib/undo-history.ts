export const MAX_HISTORY = 50;

export type UndoHistory<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function init<T>(value: T): UndoHistory<T> {
  return { past: [], present: value, future: [] };
}

export function push<T>(
  history: UndoHistory<T>,
  value: T | ((prev: T) => T),
): UndoHistory<T> {
  const newPresent =
    typeof value === "function"
      ? (value as (prev: T) => T)(history.present)
      : value;
  const past = [...history.past, history.present];
  return {
    past: past.length > MAX_HISTORY ? past.slice(past.length - MAX_HISTORY) : past,
    present: newPresent,
    future: [],
  };
}

export function undo<T>(history: UndoHistory<T>): UndoHistory<T> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: UndoHistory<T>): UndoHistory<T> {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

export function canUndo<T>(history: UndoHistory<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: UndoHistory<T>): boolean {
  return history.future.length > 0;
}
