import { useEffect } from 'react';
import { historyManager } from '../engine/HistoryManager';
import { useToolStore } from '../stores/toolStore';

export function useKeyboard() {
  const setTool = useToolStore((state) => state.setTool);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          historyManager.redo();
        } else {
          historyManager.undo();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'h': setTool('pan'); break;
        case 'p': setTool('pen'); break;
        case 'r': setTool('rect'); break;
        case 'e': setTool('ellipse'); break;
        case 'a': setTool('arrow'); break;
        case 'l': setTool('line'); break;
        case 't': setTool('text'); break;
        case 's': setTool('sticky'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);
}
