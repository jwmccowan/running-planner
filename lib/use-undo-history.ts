import { useCallback, useEffect, useRef, useState } from "react";
import * as UH from "./undo-history";

export function useUndoHistory<T>(initialValue: T) {
  const [history, setHistory] = useState(() => UH.init(initialValue));
  const savedRef = useRef<T>(initialValue);

  const set = useCallback((value: T | ((prev: T) => T)) => {
    setHistory((h) => UH.push(h, value));
  }, []);

  const undo = useCallback(() => {
    setHistory(UH.undo);
  }, []);

  const redo = useCallback(() => {
    setHistory(UH.redo);
  }, []);

  const markSaved = useCallback(() => {
    savedRef.current = history.present;
  }, [history.present]);

  const isSaved = history.present === savedRef.current;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    value: history.present,
    set,
    undo,
    redo,
    canUndo: UH.canUndo(history),
    canRedo: UH.canRedo(history),
    isSaved,
    markSaved,
  };
}
